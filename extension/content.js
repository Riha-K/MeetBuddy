const MEETING_CODE = /\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?|$)/i;
const STABLE_MS = 800;

let candidate = null;
let wasInMeeting = inMeeting();

function inMeeting() {
  return MEETING_CODE.test(location.pathname);
}

function captionsRegion() {
  return (
    document.querySelector('[role="region"][aria-label="Captions"]') ||
    document.querySelector('[role="region"][aria-label*="Caption" i]')
  );
}

function ensureCaptionsOn() {
  if (captionsRegion()) return;
  const buttons = document.querySelectorAll("button[aria-label]");
  for (const button of buttons) {
    const label = button.getAttribute("aria-label") || "";
    if (/turn on captions/i.test(label)) {
      button.click();
      return;
    }
  }
}

function rowFromImage(img, region) {
  let row = img.parentElement;
  for (let depth = 0; depth < 5 && row && row !== region; depth += 1) {
    const text = row.innerText || "";
    if (text.split("\n").map((line) => line.trim()).filter(Boolean).length >= 2) {
      return row;
    }
    row = row.parentElement;
  }
  return null;
}

function readVisibleCaptions() {
  const region = captionsRegion();
  if (!region) return [];
  const rows = [];
  for (const img of region.querySelectorAll("img")) {
    const row = rowFromImage(img, region);
    if (row && !rows.includes(row)) rows.push(row);
  }
  const parsed = [];
  for (const row of rows) {
    const line = MeetBuddyCaptions.parseCaptionBlock(row.innerText);
    if (line) parsed.push(line);
  }
  return parsed;
}

function remember(line) {
  const key = `${line.speaker}\u0000${line.text}`;
  if (!candidate || candidate.key !== key) {
    candidate = { key, line, since: Date.now() };
    return;
  }
  if (Date.now() - candidate.since < STABLE_MS || candidate.sent) return;
  candidate.sent = true;
  chrome.runtime.sendMessage({ type: "caption", speaker: line.speaker, text: line.text });
}

function scan() {
  if (!inMeeting()) return;
  ensureCaptionsOn();
  for (const line of readVisibleCaptions()) remember(line);
}

function flushCandidate() {
  if (!candidate || candidate.sent) return;
  candidate.sent = true;
  chrome.runtime.sendMessage({
    type: "caption",
    speaker: candidate.line.speaker,
    text: candidate.line.text,
  });
}

function watchMeeting() {
  const now = inMeeting();
  if (wasInMeeting && !now) {
    flushCandidate();
    chrome.runtime.sendMessage({ type: "meeting-ended" });
  }
  wasInMeeting = now;
  if (now) scan();
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
setInterval(watchMeeting, 1000);
scan();
