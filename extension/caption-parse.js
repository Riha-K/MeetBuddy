(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.MeetBuddyCaptions = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  /**
   * Meet caption blocks are usually:
   *   Speaker Name
   *   caption text…
   * Sometimes Meet repeats/extends the same line as speech grows.
   */
  function parseCaptionBlock(blockText) {
    const bits = String(blockText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (bits.length < 2) return null;
    const speaker = bits[0];
    const text = bits.slice(1).join(" ").replace(/\s+/g, " ").trim();
    if (!text || text.toLowerCase() === speaker.toLowerCase()) return null;
    // Ignore tiny noise fragments that are not real speech yet.
    if (text.length < 2) return null;
    return { speaker, text };
  }

  function mergeLine(lines, incoming) {
    if (!incoming || !incoming.speaker || !incoming.text) {
      return lines.map((line) => ({ speaker: line.speaker, text: line.text }));
    }
    const next = lines.map((line) => ({ speaker: line.speaker, text: line.text }));
    const last = next[next.length - 1];
    if (!last) {
      next.push({ speaker: incoming.speaker, text: incoming.text });
      return next;
    }

    const sameSpeaker = last.speaker === incoming.speaker;
    // Growing caption for the same speaker: replace with the longer text.
    if (sameSpeaker && incoming.text.startsWith(last.text)) {
      next[next.length - 1] = { speaker: incoming.speaker, text: incoming.text };
      return next;
    }
    // Duplicate or shorter echo of the same line: keep existing.
    if (
      sameSpeaker &&
      (last.text === incoming.text || last.text.startsWith(incoming.text))
    ) {
      return next;
    }
    // Soft merge when Meet inserts a mid-sentence correction that overlaps the tail.
    if (sameSpeaker && last.text.length > 12) {
      const tail = last.text.slice(-24);
      const overlapAt = incoming.text.indexOf(tail);
      if (overlapAt > 0 && overlapAt < incoming.text.length) {
        next[next.length - 1] = {
          speaker: incoming.speaker,
          text: last.text + incoming.text.slice(overlapAt + tail.length),
        };
        return next;
      }
    }

    next.push({ speaker: incoming.speaker, text: incoming.text });
    return next;
  }

  function formatTranscript(lines) {
    return (lines || [])
      .filter((line) => line && line.speaker && line.text)
      .map((line) => `${line.speaker}: ${line.text}`)
      .join("\n");
  }

  return { parseCaptionBlock, mergeLine, formatTranscript };
});
