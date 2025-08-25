// contentScript.js
// Inject a floating toolbar inside Gmail to summarize the open email.
(function() {
  const U = window.EmailSummarizerUtils;

  function getOpenEmailBodyNode() {
    // Gmail renders the opened email content within div[role="listitem"] .adn .a3s
    const candidates = document.querySelectorAll('div[role="listitem"] .adn .a3s, .a3s.aiL');
    let best = null, bestLen = 0;
    for (const el of candidates) {
      const text = el.innerText || el.textContent || "";
      if (text.length > bestLen) {
        best = el; bestLen = text.length;
      }
    }
    return best;
  }

  function ensureToolbar() {
    if (document.querySelector('.ai-sum-toolbar')) return document.querySelector('.ai-sum-toolbar');

    const wrap = document.createElement('div');
    wrap.className = 'ai-sum-toolbar';
    wrap.innerHTML = `
      <h4>AI Email Summarizer</h4>
      <div>
        <button id="ai-sum-btn">Summarize</button>
        <button class="secondary" id="ai-sum-highlight-btn">Highlight Actions</button>
        <button class="secondary" id="ai-sum-copy-btn">Copy</button>
      </div>
      <div class="ai-sum-panel">
        <div class="ai-sum-card">
          <strong>Summary</strong>
          <div id="ai-sum-output" style="margin-top:6px;">—</div>
          <div class="ai-sum-micro" id="ai-sum-mode-note"></div>
        </div>
        <div class="ai-sum-card">
          <strong>Action Items</strong>
          <ul id="ai-sum-actions" style="margin-top:6px; padding-left:18px;"></ul>
        </div>
      </div>
    `;
    document.documentElement.appendChild(wrap);

    wrap.querySelector('#ai-sum-btn').addEventListener('click', summarizeCurrent);
    wrap.querySelector('#ai-sum-highlight-btn').addEventListener('click', highlightActions);
    wrap.querySelector('#ai-sum-copy-btn').addEventListener('click', copyAll);

    return wrap;
  }

  async function getSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get({
        mode: "offline", // offline | ai
        sentences: 5,
        openai_api_key: "",
        openai_model: "gpt-4o-mini",
        auto_on_open: false
      }, resolve);
    });
  }

  async function summarizeCurrent() {
    const bodyNode = getOpenEmailBodyNode();
    if (!bodyNode) {
      alert("Couldn't find the email body. Open an email first.");
      return;
    }
    const text = bodyNode.innerText || bodyNode.textContent || "";
    const toolbar = ensureToolbar();
    const out = toolbar.querySelector('#ai-sum-output');
    const actionsUl = toolbar.querySelector('#ai-sum-actions');
    const modeNote = toolbar.querySelector('#ai-sum-mode-note');
    out.textContent = "Summarizing...";

    const settings = await getSettings();

    if (settings.mode === "ai" && settings.openai_api_key) {
      // Ask background to summarize with LLM to keep key usage centralized
      try {
        const resp = await chrome.runtime.sendMessage({type: "summarizeWithLLM", text, model: settings.openai_model});
        const {summary, items, error} = resp || {};
        if (error) throw new Error(error);
        out.textContent = summary || "No summary.";
        actionsUl.innerHTML = "";
        (items || []).forEach(it => {
          const li = document.createElement('li');
          li.textContent = it.due ? `${it.task} (Due: ${it.due})` : it.task;
          actionsUl.appendChild(li);
        });
        modeNote.textContent = "Mode: AI model (" + settings.openai_model + ")";
      } catch (e) {
        out.textContent = "AI request failed, falling back to offline summary.";
        await offlineSummarize(text, out, actionsUl);
        modeNote.textContent = "Mode: Offline (AI failed)";
      }
    } else {
      await offlineSummarize(text, out, actionsUl);
      modeNote.textContent = "Mode: Offline";
    }
  }

  async function offlineSummarize(text, outNode, actionsUl) {
    const summary = U.makeSummary(text, {sentences: 5});
    const items = U.extractActionItems(text);
    outNode.textContent = summary || "No content to summarize.";
    actionsUl.innerHTML = "";
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = it.due ? `${it.task} (Due: ${it.due})` : it.task;
      actionsUl.appendChild(li);
    });
  }

  function highlightActions() {
    const bodyNode = getOpenEmailBodyNode();
    if (!bodyNode) return;
    const text = bodyNode.innerText || bodyNode.textContent || "";
    const items = U.extractActionItems(text);
    U.highlightInNode(bodyNode, items);
  }

  function copyAll() {
    const toolbar = ensureToolbar();
    const summary = toolbar.querySelector('#ai-sum-output')?.textContent || "";
    const lis = Array.from(toolbar.querySelectorAll('#ai-sum-actions li')).map(li => "- " + li.textContent).join("\n");
    const blob = `Summary:\n${summary}\n\nAction Items:\n${lis || "(none)"}`;
    navigator.clipboard.writeText(blob);
  }

  // Auto-run when email opens if enabled
  let lastUrl = location.href;
  setInterval(async () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      const s = await getSettings();
      if (s.auto_on_open) {
        setTimeout(() => {
          try {
            ensureToolbar();
            summarizeCurrent();
          } catch (e) {}
        }, 1200);
      } else {
        ensureToolbar();
      }
    }
  }, 1000);

  // Initial
  ensureToolbar();
})(); 
