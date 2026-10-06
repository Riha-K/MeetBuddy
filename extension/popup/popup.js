const statusEl = document.querySelector("#status");
const detailEl = document.querySelector("#detail");
const emailEl = document.querySelector("#email");
const serverEl = document.querySelector("#server");
const sendBtn = document.querySelector("#send");

function statusText(state) {
  if (!state.inMeet && !state.count) return "Open a Google Meet tab to capture captions.";
  if (state.sent) return `Summary sent. ${state.count} caption line${state.count === 1 ? "" : "s"} captured.`;
  if (state.ended) return `Meeting ended. ${state.count} caption line${state.count === 1 ? "" : "s"} ready to send.`;
  if (state.count) return `Capturing captions. ${state.count} line${state.count === 1 ? "" : "s"} so far.`;
  return "Meet is open. Turn on captions if they are not visible yet.";
}

async function refresh() {
  const state = await chrome.runtime.sendMessage({ type: "status" });
  if (!emailEl.value) emailEl.value = state.email || "";
  if (!serverEl.value) serverEl.value = state.server || "http://127.0.0.1:3001";
  statusEl.textContent = statusText(state);
  detailEl.textContent = state.lastError || state.summary || "";
  sendBtn.disabled = !state.count;
}

emailEl.addEventListener("change", saveSettings);
serverEl.addEventListener("change", saveSettings);

async function saveSettings() {
  await chrome.runtime.sendMessage({
    type: "save-settings",
    email: emailEl.value,
    server: serverEl.value,
  });
}

sendBtn.addEventListener("click", async () => {
  sendBtn.disabled = true;
  detailEl.textContent = "Sending…";
  await saveSettings();
  const result = await chrome.runtime.sendMessage({ type: "send-now" });
  detailEl.textContent = result && result.ok ? result.summary : (result && result.error) || "Could not send the summary";
  await refresh();
});

refresh();
