(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.MeetBuddyCaptions = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function parseCaptionBlock(blockText) {
    const bits = String(blockText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (bits.length < 2) return null;
    const speaker = bits[0];
    const text = bits.slice(1).join(" ");
    if (!text || text.toLowerCase() === speaker.toLowerCase()) return null;
    return { speaker, text };
  }

  function mergeLine(lines, incoming) {
    const next = lines.map((line) => ({ speaker: line.speaker, text: line.text }));
    const last = next[next.length - 1];
    if (!last) {
      next.push({ speaker: incoming.speaker, text: incoming.text });
      return next;
    }
    if (last.speaker === incoming.speaker && incoming.text.startsWith(last.text)) {
      next[next.length - 1] = { speaker: incoming.speaker, text: incoming.text };
      return next;
    }
    if (
      last.speaker === incoming.speaker &&
      (last.text === incoming.text || last.text.startsWith(incoming.text))
    ) {
      return next;
    }
    next.push({ speaker: incoming.speaker, text: incoming.text });
    return next;
  }

  function formatTranscript(lines) {
    return lines.map((line) => `${line.speaker}: ${line.text}`).join("\n");
  }

  return { parseCaptionBlock, mergeLine, formatTranscript };
});
