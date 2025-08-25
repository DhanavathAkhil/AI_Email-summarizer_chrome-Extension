// options.js
async function load() {
  const s = await chrome.storage.sync.get({ openai_api_key: "" });
  document.getElementById('key').value = s.openai_api_key || "";
}

async function save() {
  const key = document.getElementById('key').value.trim();
  await chrome.storage.sync.set({ openai_api_key: key });
  alert("Saved.");
}

async function clearKey() {
  await chrome.storage.sync.set({ openai_api_key: "" });
  document.getElementById('key').value = "";
  alert("Cleared.");
}

document.getElementById('save').addEventListener('click', save);
document.getElementById('clear').addEventListener('click', clearKey);
document.addEventListener('DOMContentLoaded', load);
