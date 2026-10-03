importScripts("caption-parse.js");

const DEFAULT_SERVER = "http://127.0.0.1:3001";
const sending = new Set();

function tabKey(tabId) {
  return `tab:${tabId}`;
}

async function loadMeeting(tabId) {
  const key = tabKey(tabId);
  const stored = await chrome.storage.session.get(key);
  return stored[key] || { lines: [], url: "", sent: false, ended: false };
}

async function saveMeeting(tabId, meeting) {
  await chrome.storage.session.set({ [tabKey(tabId)]: meeting, lastMeeting: meeting });
}

async function settings() {
  const stored = await chrome.storage.local.get({
    email: "",
    server: DEFAULT_SERVER,
  });
  return stored;
}

async function addCaption(tabId, speaker, text, url) {
  const meeting = await loadMeeting(tabId);
  if (url) meeting.url = url;
  meeting.lines = MeetBuddyCaptions.mergeLine(meeting.lines, { speaker, text });
  await saveMeeting(tabId, meeting);
  return meeting;
}

function transcriptOf(meeting) {
  return meeting.lines.map((line) => `${line.speaker}: ${line.text}`).join("\n");
}

async function sendSummary(meeting) {
  const { email, server } = await settings();
  if (!email) {
    return { ok: false, error: "Add an email in the popup first." };
  }
  if (!meeting.lines.length) {
    return { ok: false, error: "No captions captured yet." };
  }
  const response = await fetch(`${server.replace(/\/$/, "")}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: transcriptOf(meeting), to: email }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: body.error || `Server responded ${response.status}` };
  }
  return { ok: true, summary: body.summary };
}

async function finishMeeting(tabId) {
  if (sending.has(tabId)) {
    return { ok: false, error: "Summary already sending." };
  }
  const meeting = await loadMeeting(tabId);
  meeting.ended = true;
  if (meeting.sent || !meeting.lines.length) {
    await saveMeeting(tabId, meeting);
    return { ok: false, error: meeting.sent ? "Summary already sent." : "No captions captured yet." };
  }
  sending.add(tabId);
  try {
    const result = await sendSummary(meeting);
    if (result.ok) meeting.sent = true;
    meeting.lastError = result.ok ? "" : result.error;
    meeting.summary = result.summary || meeting.summary || "";
    await saveMeeting(tabId, meeting);
    return result;
  } finally {
    sending.delete(tabId);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id ?? message.tabId;
  (async () => {
    if (message.type === "caption") {
      const meeting = await addCaption(tabId, message.speaker, message.text, sender.tab?.url);
      sendResponse({ count: meeting.lines.length });
      return;
    }
    if (message.type === "meeting-ended") {
      sendResponse(await finishMeeting(tabId));
      return;
    }
    if (message.type === "status") {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      const meeting = active ? await loadMeeting(active.id) : { lines: [], ended: false, sent: false };
      const stored = await chrome.storage.session.get("lastMeeting");
      const onMeet = Boolean(active?.url && active.url.includes("meet.google.com"));
      const current = onMeet || meeting.lines.length ? meeting : stored.lastMeeting || meeting;
      const prefs = await settings();
      sendResponse({
        tabId: active?.id ?? null,
        inMeet: Boolean(active?.url && active.url.includes("meet.google.com")),
        count: current.lines?.length || 0,
        ended: Boolean(current.ended),
        sent: Boolean(current.sent),
        summary: current.summary || "",
        lastError: current.lastError || "",
        email: prefs.email,
        server: prefs.server,
      });
      return;
    }
    if (message.type === "save-settings") {
      await chrome.storage.local.set({
        email: String(message.email || "").trim(),
        server: String(message.server || DEFAULT_SERVER).trim() || DEFAULT_SERVER,
      });
      sendResponse({ ok: true });
      return;
    }
    if (message.type === "send-now") {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      const stored = await chrome.storage.session.get("lastMeeting");
      const activeMeeting = active ? await loadMeeting(active.id) : null;
      const onMeet = Boolean(active?.url && active.url.includes("meet.google.com"));
      const meeting = onMeet || activeMeeting?.lines.length ? activeMeeting : stored.lastMeeting;
      if (!meeting?.lines.length) {
        sendResponse({ ok: false, error: "No captions captured yet." });
        return;
      }
      if (active && sending.has(active.id)) {
        sendResponse({ ok: false, error: "Summary already sending." });
        return;
      }
      if (active) sending.add(active.id);
      try {
        const result = await sendSummary(meeting);
        meeting.ended = true;
        if (result.ok) meeting.sent = true;
        meeting.lastError = result.ok ? "" : result.error;
        meeting.summary = result.summary || "";
        if (active) await saveMeeting(active.id, meeting);
        else await chrome.storage.session.set({ lastMeeting: meeting });
        sendResponse(result);
      } finally {
        if (active) sending.delete(active.id);
      }
    }
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message });
  });
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  finishMeeting(tabId).catch(() => {});
});
