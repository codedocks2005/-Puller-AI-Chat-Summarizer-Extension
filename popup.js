/**
 * popup.js — MVP logic for Puller.
 *
 * Summarization is handled by your backend server — no API keys here.
 * To switch environments, update BACKEND_URL below.
 */

"use strict";

// ── Backend URL ───────────────────────────────────────────────────────────────
// Local dev:
const BACKEND_URL = "https://puller-backend.vercel.app/api/summarize";
// Production: paste your Vercel URL here when ready, e.g.:
// const BACKEND_URL = "https://your-project.vercel.app/api/summarize";

const MAX_CHARS = 28_000; // truncate huge transcripts before sending

// ── Universal scraper (injected into the active tab on-demand) ───────────────
//
// This function runs INSIDE the tab's page context — not in popup.
// It must be completely self-contained (no references to outer scope).
//
function scrapePageContent() {
  function clean(text) {
    return (text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();
  }

  function byDomOrder(a, b) {
    return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  }

  const host = window.location.hostname;
  let result = null;

  // ── ChatGPT ──────────────────────────────────────────────────────────────
  if (host.includes("chatgpt.com")) {
    const turns = [...document.querySelectorAll("[data-message-author-role]")];
    if (turns.length) {
      result = turns
        .map(el => {
          const role = el.getAttribute("data-message-author-role");
          const text = clean(el.innerText);
          return text ? `${role === "user" ? "USER" : "AI"}: ${text}` : null;
        })
        .filter(Boolean).join("\n\n");
    }
  }

  // ── Claude ───────────────────────────────────────────────────────────────
  if (!result && host.includes("claude.ai")) {
    const humanEls = [...document.querySelectorAll('[data-testid="human-turn"]')];
    const aiEls    = [...document.querySelectorAll('[data-testid="assistant-turn"]')];
    if (humanEls.length || aiEls.length) {
      const merged = [
        ...humanEls.map(el => ({ el, label: "USER" })),
        ...aiEls.map(el   => ({ el, label: "AI"   })),
      ].sort(byDomOrder);
      const lines = merged
        .map(({ el, label }) => { const t = clean(el.innerText); return t ? `${label}: ${t}` : null; })
        .filter(Boolean);
      if (lines.length) result = lines.join("\n\n");
    }
    if (!result) {
      const articles = [...document.querySelectorAll("article")];
      if (articles.length) {
        result = articles
          .map((el, i) => { const t = clean(el.innerText); return t ? `${i % 2 === 0 ? "USER" : "AI"}: ${t}` : null; })
          .filter(Boolean).join("\n\n");
      }
    }
  }

  // ── Gemini ───────────────────────────────────────────────────────────────
  if (!result && host.includes("gemini.google.com")) {
    const userEls  = [...document.querySelectorAll("user-query, [data-turn-role='user']")];
    const modelEls = [...document.querySelectorAll("model-response, [data-turn-role='model']")];
    if (userEls.length || modelEls.length) {
      const merged = [
        ...userEls.map(el  => ({ el, label: "USER" })),
        ...modelEls.map(el => ({ el, label: "AI"   })),
      ].sort(byDomOrder);
      const lines = merged
        .map(({ el, label }) => { const t = clean(el.innerText); return t ? `${label}: ${t}` : null; })
        .filter(Boolean);
      if (lines.length) result = lines.join("\n\n");
    }
  }

  // ── Generic fallback: works on any AI chat site ───────────────────────────
  if (!result) {
    const genericSelectors = [
      "[data-message-role]",
      "[data-role='user'], [data-role='assistant']",
      "[class*='UserMessage'], [class*='AssistantMessage']",
      "[class*='human-turn'], [class*='assistant-turn']",
      "[class*='message-bubble']",
      "[class*='ChatMessage']",
      "article",
      "[class*='turn']",
    ];
    for (const sel of genericSelectors) {
      try {
        const els = [...document.querySelectorAll(sel)];
        if (els.length > 1) {
          const lines = els
            .map((el, i) => { const t = clean(el.innerText); return t ? `MSG ${i + 1}: ${t}` : null; })
            .filter(Boolean);
          if (lines.length) { result = lines.join("\n\n"); break; }
        }
      } catch (_) { /* skip invalid selectors */ }
    }
  }

  // ── Final fallback: grab visible text from <main> or <body> ──────────────
  if (!result) {
    const main = document.querySelector("main");
    result = clean(main?.innerText || document.body?.innerText || "");
  }

  return result || "No readable content found on this page.";
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const summarizeBtn = document.getElementById("summarize-btn");
const btnIcon      = document.getElementById("btn-icon");
const btnText      = document.getElementById("btn-text");
const outputBox    = document.getElementById("output-box");
const outputText   = document.getElementById("output-text");
const statusDot    = document.getElementById("status-dot");
const siteLabel    = document.getElementById("site-label");
const copyBtn      = document.getElementById("copy-btn");
const copyIcon     = document.getElementById("copy-icon");
const copyText     = document.getElementById("copy-text");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function hostname(url) {
  try { return new URL(url).hostname; } catch { return ""; }
}

// ── UI state helpers ──────────────────────────────────────────────────────────

function setLoading(msg) {
  outputBox.className = "is-loading";
  swapIcon(createSpinner());
  outputText.textContent = msg;
  summarizeBtn.disabled = true;
  btnIcon.textContent = "⏳";
  btnText.textContent = "Working…";
  copyBtn.disabled = true;
}

function setResult(text) {
  outputBox.className = "has-content";
  swapIcon(makeIcon("📋"));
  outputText.textContent = text;
  resetBtn();
  copyBtn.disabled = false;
  copyBtn.classList.remove("copied");
  copyIcon.textContent = "📋";
  copyText.textContent = "Copy Summary";
}

function setError(msg) {
  outputBox.className = "is-error";
  swapIcon(makeIcon("⚠️"));
  outputText.textContent = msg;
  resetBtn();
  copyBtn.disabled = true;
}

function resetBtn() {
  summarizeBtn.disabled = false;
  btnIcon.textContent = "✨";
  btnText.textContent = "Summarize Current Chat";
}

function swapIcon(newEl) {
  const old = outputBox.querySelector(".output-icon, .spinner");
  if (old) old.replaceWith(newEl);
  else outputBox.prepend(newEl);
}

function makeIcon(emoji) {
  const el = document.createElement("span");
  el.className = "output-icon";
  el.id = "output-icon";
  el.textContent = emoji;
  return el;
}

function createSpinner() {
  const el = document.createElement("div");
  el.className = "spinner";
  return el;
}

// ── Backend API ───────────────────────────────────────────────────────────────

async function fetchSummaryFromServer(chatText) {
  // Truncate if needed before sending
  const truncated = chatText.length > MAX_CHARS
    ? chatText.slice(0, MAX_CHARS) + "\n\n[... transcript truncated ...]"
    : chatText;

  let res;
  try {
    res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatText: truncated }),
    });
  } catch {
    // Network error — server not reachable at all
    throw new Error("Connection to server failed. Make sure your backend is running.");
  }

  if (!res.ok) {
    // Server responded but with an error status
    throw new Error("Connection to server failed. Make sure your backend is running.");
  }

  const data = await res.json();
  const summary = data?.summary?.trim();

  if (!summary) throw new Error("Server returned an empty summary.");

  console.log("[Puller] Summary received:", summary);
  console.log(`[Puller] Response length: ${summary.length} characters`);

  return summary;
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const tab  = await getActiveTab();
  const host = hostname(tab?.url || "");

  if (host) {
    statusDot.classList.add("active");
    siteLabel.textContent  = host;
    summarizeBtn.disabled  = false;
    outputText.textContent = "Click Summarize to scrape and summarize this chat.";
  } else {
    siteLabel.textContent  = "No active page detected";
    outputText.textContent = "Open an AI chat page and try again.";
  }
}

// ── Summarize flow ────────────────────────────────────────────────────────────

summarizeBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  // 1 · Scrape
  setLoading("Scraping chat from the page…");

  let rawText;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePageContent,
    });
    rawText = results?.[0]?.result;
  } catch (err) {
    setError(
      err.message?.includes("Cannot access")
        ? "Cannot access this page.\n\nChrome blocks extension scripts on chrome:// and Web Store pages."
        : `Scrape failed: ${err.message}`
    );
    return;
  }

  if (!rawText?.trim()) {
    setError("No readable chat content found on this page.");
    return;
  }

  // 2 · Summarize via backend
  setLoading("Summarizing via server…");

  try {
    const summary = await fetchSummaryFromServer(rawText);
    setResult(summary);
  } catch (err) {
    setError(err.message);
  }
});

// ── Copy button ───────────────────────────────────────────────────────────────

copyBtn.addEventListener("click", async () => {
  const text = outputText.textContent?.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);

    copyBtn.classList.add("copied");
    copyIcon.textContent = "✅";
    copyText.textContent = "Copied!";

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyIcon.textContent = "📋";
      copyText.textContent = "Copy Summary";
    }, 2000);
  } catch {
    copyIcon.textContent = "⚠️";
    copyText.textContent = "Copy failed";
    setTimeout(() => {
      copyIcon.textContent = "📋";
      copyText.textContent = "Copy Summary";
    }, 2000);
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
init();