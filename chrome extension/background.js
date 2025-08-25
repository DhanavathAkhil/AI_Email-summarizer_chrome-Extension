// background.js (service worker)
// Handles LLM calls using the user's API key stored in chrome.storage.sync.
// Uses OpenAI-compatible /v1/chat/completions endpoint.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "summarizeWithLLM") {
    (async () => {
      try {
        const {text, model} = msg;
        const settings = await chrome.storage.sync.get({ openai_api_key: "" });
        const key = settings.openai_api_key;
        if (!key) {
          sendResponse({error: "No API key set."});
          return;
        }
        const prompt = [
          {"role":"system","content":"You are an assistant that summarizes emails. Output a concise summary (4-6 sentences) and extract actionable tasks with any due dates. Return strict JSON with keys: summary (string) and items (array of {task: string, due?: string})."},
          {"role":"user","content": text.slice(0, 12000)}
        ];
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + key
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: prompt,
            temperature: 0.2
          })
        });
        if (!res.ok) {
          const t = await res.text();
          sendResponse({error: "LLM API error: " + t});
          return;
        }
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        // Try to parse JSON from the model output. If it isn't pure JSON, attempt a naive fix.
        let parsed = null;
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          const m = content.match(/\{[\s\S]*\}/);
          if (m) {
            parsed = JSON.parse(m[0]);
          }
        }
        if (!parsed || typeof parsed !== "object") {
          sendResponse({error: "Unexpected model output"});
          return;
        }
        sendResponse({summary: parsed.summary || "", items: parsed.items || []});
      } catch (e) {
        sendResponse({error: e.message || String(e)});
      }
    })();
    return true; // keep the message channel open for async sendResponse
  }
});
