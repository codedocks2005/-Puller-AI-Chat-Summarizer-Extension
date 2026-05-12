# AI Chat Summarizer — Chrome Extension

A Manifest V3 Chrome Extension that summarizes ChatGPT and Claude conversations with a single click.

## Project Structure

```
puller/
├── manifest.json   ← Extension config (MV3)
├── popup.html      ← Popup UI
├── popup.js        ← Popup logic & message passing
├── content.js      ← Content script (chat scraper)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Loading into Chrome (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions`
2. Toggle **Developer mode** ON (top-right corner)
3. Click **Load unpacked**
4. Select this entire `puller/` folder
5. The extension icon will appear in the toolbar

## Testing the Flow

1. Open [chatgpt.com](https://chatgpt.com) or [claude.ai](https://claude.ai) and start/open a conversation
2. Click the extension icon
3. The status dot will turn **green** (supported page detected)
4. Click **Summarize Current Chat**
5. You'll see: `Scraping…` → `Summarizing…` → preview of scraped content

> The LLM summarization call is **not yet wired** — the output shows raw scraped text.
> See `popup.js → simulateLLMCall()` to connect your API.

## Next Steps

### Phase 2 — Smart DOM Parsing
Replace the generic `document.body.innerText` fallback in `content.js` with
site-specific selectors inside the `SITE_SELECTORS` object:

```js
// content.js
const SITE_SELECTORS = {
  "chatgpt.com": ['[data-message-author-role]'],
  "claude.ai":   ['[data-testid="human-turn"]', '[data-testid="ai-turn"]'],
};
```

### Phase 3 — LLM Integration
Replace `simulateLLMCall()` in `popup.js` with a real API call:

```js
async function summarizeWithLLM(text) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${YOUR_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize the following chat conversation concisely." },
        { role: "user",   content: text },
      ],
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content;
}
```

> ⚠️ For production, **never hard-code API keys** in the extension. Use a backend proxy or Chrome's `storage.sync` with a user-provided key.
