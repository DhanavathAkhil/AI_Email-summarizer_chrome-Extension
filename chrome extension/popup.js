// popup.js
async function load() {
  const s = await chrome.storage.sync.get({
    mode: "offline",
    openai_model: "gpt-4o-mini",
    auto_on_open: false
  });
  document.getElementById('mode').value = s.mode;
  document.getElementById('model').value = s.openai_model;
  document.getElementById('auto_on_open').checked = !!s.auto_on_open;
}

async function save() {
  const mode = document.getElementById('mode').value;
  const model = document.getElementById('model').value.trim() || "gpt-4o-mini";
  const auto_on_open = document.getElementById('auto_on_open').checked;
  await chrome.storage.sync.set({ mode, openai_model: model, auto_on_open });
  window.close();
}

document.getElementById('save').addEventListener('click', save);
document.addEventListener('DOMContentLoaded', load);
