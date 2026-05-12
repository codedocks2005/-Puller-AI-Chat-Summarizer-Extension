# ✨ Puller — AI Chat Summarizer Extension

> Instantly summarize any AI chat conversation with one click.  
> Works on ChatGPT, Claude, Gemini, and most AI chat interfaces.



---

## What it does

You've just had a long conversation with an AI. Instead of scrolling back through hundreds of messages, hit **Summarize** — Puller scrapes the chat and gives you a clean structured breakdown:

- 🗂 Conversation overview
- ❗ Problems & questions raised
- 💡 Solutions & answers provided
- 🔧 Technical details & code mentioned
- ✅ Action items & next steps
- 📌 Key takeaways

Copy the summary with one click and paste it anywhere — into Notion, Obsidian, an email, or another AI.

---

## Supported Sites

| Site | Status |
|---|---|
| chatgpt.com | ✅ Full support |
| claude.ai | ✅ Full support |
| gemini.google.com | ✅ Full support |
| Any AI chat site | ⚡ Generic fallback |

---

## Install (2 minutes, no account needed)

### Step 1 — Download the extension

Click the green **Code** button on this page → **Download ZIP**

![Download ZIP]

Unzip the folder anywhere on your computer.

### Step 2 — Load it in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** using the toggle in the top right
3. Click **Load unpacked**
4. Select the unzipped `puller-extension` folder

### Step 3 — Pin it and use it

1. Click the puzzle piece 🧩 icon in Chrome toolbar
2. Pin **Puller**
3. Open any AI chat (ChatGPT, Claude, Gemini)
4. Click **Summarize Current Chat**

That's it. No API key. No signup. No configuration. Everything is handled by the backend.

---

## How it works

```
You click Summarize
       ↓
Extension scrapes the chat from the page (runs locally in your browser)
       ↓
Raw transcript sent to the hosted backend
       ↓
Backend calls Gemini API
       ↓
Structured summary returned and displayed
```

Your chat data flows: **browser → backend → Gemini → back to you.**  
No accounts. No logging. No tracking.

---

## Project Structure

```
puller-extension/
├── manifest.json       # Extension config
├── popup.html          # Extension UI
├── popup.js            # Core logic: scraping + API calls
├── popup.css           # Styles
└── icons/              # Extension icons
```

---

## Self Hosting

Want to run your own backend instead of using the hosted one?

👉 [puller-backend](https://github.com/codedocks2005/puller-backend) — deploy to Vercel for free in one click, bring your own Gemini API key.

---

## Contributing

PRs are welcome. If Puller doesn't work on a specific AI chat site, open an issue with the site URL and I'll add a scraper for it.

---

## License

MIT — do whatever you want with it.
