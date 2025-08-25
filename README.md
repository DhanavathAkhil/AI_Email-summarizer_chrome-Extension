# AI-Powered Email Summarizer (Chrome Extension)

Summarizes long Gmail emails and highlights action items. Works **offline** with a heuristic extractive summarizer, and can optionally use an **AI model** if you provide an OpenAI API key.

## Features
- Floating toolbar in Gmail: **Summarize**, **Highlight Actions**, **Copy**.
- Offline extractive summary (no API required).
- AI mode using your OpenAI API key (Options → set key).
- Detects **action items** and due dates; highlights them in the email body.
- Auto-summarize on open (toggle in popup).

## Install
1. Download and unzip this folder.
2. Go to `chrome://extensions` → enable **Developer mode**.
3. Click **Load unpacked** and select the `chrome extension` folder.

## Usage
- Open an email in Gmail. The floating "AI Email Summarizer" toolbar appears at bottom-right.
- Click **Summarize** to generate a summary and extract tasks.
- Click **Highlight Actions** to mark tasks inside the email body.
- Click **Copy** to copy the summary + tasks.

## AI Mode
- Click the extension icon → **Set API Key** (options page) → paste your key.
- In the popup, switch **Mode** to "AI model" and choose a model (default `gpt-4o-mini`).
- Your key is stored in `chrome.storage.sync` and used only from your browser.

## Notes
- This extension is tailored for Gmail's DOM; minor changes by Google can affect selectors.
- Offline summarizer is extractive and not perfect; AI mode yields higher quality.
- No data is transmitted anywhere except to the model provider you configure.

## Files
- `manifest.json` – Extension manifest (MV3).
- `background.js` – Service worker; calls the OpenAI API.
- `contentScript.js` – Injects toolbar and logic into Gmail.
- `utils.js` – Heuristic summarizer and action item detection.
- `styles.css` – UI styles.
- `popup.html/.js/.css` – Popup to select mode and toggle auto-run.
- `options.html/.js/.css` – Options page to store API key.
- `icons/` – Placeholder icons.

## License
MIT
