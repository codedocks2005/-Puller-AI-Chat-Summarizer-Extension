/**
 * content.js — Chat scraper for ChatGPT, Claude, and Gemini.
 *
 * Priority order per site:
 *   ChatGPT  → [data-message-author-role]
 *   Claude   → [data-testid="human-turn"] / [data-testid="assistant-turn"]
 *   Gemini   → user-query / model-response web components
 *   Fallback → document.body.innerText (cleaned)
 */

"use strict";

// ── Helpers ───────────────────────────────────────────────────────────────────

function clean(text) {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/** Sort two elements by their DOM order (top → bottom). */
function byDomOrder(a, b) {
  return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1 : 1;
}

// ── Site scrapers ─────────────────────────────────────────────────────────────

function scrapeChatGPT() {
  const turns = [...document.querySelectorAll("[data-message-author-role]")];
  if (!turns.length) return null;

  return turns
    .map(el => {
      const role = el.getAttribute("data-message-author-role");
      const text = clean(el.innerText);
      return text ? `${role === "user" ? "USER" : "AI"}: ${text}` : null;
    })
    .filter(Boolean)
    .join("\n\n");
}

function scrapeClaude() {
  const humanEls = [...document.querySelectorAll('[data-testid="human-turn"]')];
  const aiEls    = [...document.querySelectorAll('[data-testid="assistant-turn"]')];

  if (humanEls.length || aiEls.length) {
    const merged = [
      ...humanEls.map(el => ({ el, label: "USER" })),
      ...aiEls.map(el   => ({ el, label: "AI"   })),
    ].sort(byDomOrder);

    const lines = merged
      .map(({ el, label }) => {
        const text = clean(el.innerText);
        return text ? `${label}: ${text}` : null;
      })
      .filter(Boolean);

    if (lines.length) return lines.join("\n\n");
  }

  // Secondary: <article> children
  const articles = [...document.querySelectorAll("article")];
  if (articles.length) {
    return articles
      .map((el, i) => {
        const text = clean(el.innerText);
        return text ? `${i % 2 === 0 ? "USER" : "AI"}: ${text}` : null;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return null;
}

function scrapeGemini() {
  const userEls  = [...document.querySelectorAll("user-query")];
  const modelEls = [...document.querySelectorAll("model-response")];

  if (userEls.length || modelEls.length) {
    const merged = [
      ...userEls.map(el  => ({ el, label: "USER" })),
      ...modelEls.map(el => ({ el, label: "AI"   })),
    ].sort(byDomOrder);

    const lines = merged
      .map(({ el, label }) => {
        const text = clean(el.innerText);
        return text ? `${label}: ${text}` : null;
      })
      .filter(Boolean);

    if (lines.length) return lines.join("\n\n");
  }

  return null;
}

// ── Fallback ──────────────────────────────────────────────────────────────────

function scrapeBody() {
  const main = document.querySelector("main");
  return clean(main?.innerText || document.body?.innerText || "");
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

function scrapeChat() {
  try {
    const host = window.location.hostname;
    let text = null;
    let src  = "fallback";

    if (host.includes("chatgpt.com")) {
      text = scrapeChatGPT(); src = "chatgpt";
    } else if (host.includes("claude.ai")) {
      text = scrapeClaude();  src = "claude";
    } else if (host.includes("gemini.google.com")) {
      text = scrapeGemini();  src = "gemini";
    }

    if (!text) {
      console.warn(`[Puller] ${src} selectors returned nothing — using body fallback.`);
      text = scrapeBody();
      src  = "body-fallback";
    } else {
      text = clean(text);
    }

    console.log(`[Puller] Scraped via "${src}" — ${text.length} chars.`);
    return { success: true, text };
  } catch (err) {
    return { success: false, error: err.message || "Scrape error." };
  }
}

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.action !== "SCRAPE_CHAT") return false;
  sendResponse(scrapeChat());
  return true;
});

console.log("[Puller] Content script ready on", window.location.hostname);
