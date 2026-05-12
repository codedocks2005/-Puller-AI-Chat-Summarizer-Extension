# ✨ Puller — AI Chat Summarizer Extension

> Instantly summarize any AI chat conversation with one click.  
> Works on ChatGPT, Claude, Gemini, and most AI chat interfaces.

![Puller in action](./screenshot.png)

---

## What it does

You've just had a long conversation with an AI. Instead of scrolling back through hundreds of messages, hit **Summarize** — Puller scrapes the chat, sends it to Gemini, and gives you a clean structured breakdown:

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

## Setup (5 minutes)

Puller uses your own Gemini API key — your data never touches our servers.  
Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey) — no credit card required.

### 1. Clone the extension

```bash
git clone https://github.com/YOUR_USERNAME/puller-extension.git
cd puller-extension
```

### 2. Add your API key

You have two options:

**Option A — Use the hosted backend (easiest):**
- Clone and deploy [puller-backend](https://github.com/YOUR_USERNAME/puller-backend) to Vercel (free)
- Open `popup.js` and set:
  ```js
  const BACKEND_URL = "https://your-project.vercel.app/api/summarize";
  ```

**Option B — Run the backend locally:**
```bash
# In the puller-backend folder
cp .env.example .env
# Add your Gemini key to .env:
# GEMINI_API_KEY=your_key_here
npm install
npm run dev
```
The backend runs at `http://localhost:3000` — the extension is already pointed at this by default.

### 3. Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `puller-extension` folder

That's it. Pin the extension and open any AI chat.

---

## How it works

```
You click Summarize
       ↓
Extension scrapes the chat from the page (runs locally in your browser)
       ↓
Raw transcript sent to puller-backend (your own server)
       ↓
Backend calls Gemini API (using your key)
       ↓
Structured summary returned and displayed
```

Your chat data flows: **browser → your backend → Gemini → back to you.**  
No third-party servers. No logging. No accounts.

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

## Backend

The backend is a separate repo:  
👉 [puller-backend](https://github.com/YOUR_USERNAME/puller-backend)

It's a minimal Next.js API route that proxies requests to Gemini. Deploy it to Vercel in one click — free tier is more than enough.

---

## Contributing

PRs are welcome. If Puller doesn't work on a specific AI chat site, open an issue with the site URL and I'll add a scraper for it.

---

## License

MIT — do whatever you want with it.
