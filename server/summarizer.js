async function summarize(transcript) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing in server/.env");
  }

  const text = String(transcript || "").trim();
  if (!text) {
    throw new Error("transcript is empty — capture captions before summarizing");
  }

  // Keep prompts bounded so long meetings do not blow the context window.
  const maxChars = Number(process.env.SUMMARY_MAX_CHARS || 24000);
  const clipped =
    text.length > maxChars
      ? text.slice(0, maxChars) + "\n\n[transcript truncated for summary]"
      : text;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemPrompt = [
    "You summarize Google Meet transcripts captured from on-screen captions (no microphone audio).",
    "Write a concise email-ready summary with these markdown headings when supported by the text:",
    "## Overview",
    "## Decisions",
    "## Action items",
    "## Open questions",
    "Rules:",
    "- Use only the transcript; do not invent attendees, deadlines, or decisions.",
    "- Leave a section out entirely when the transcript does not support it.",
    "- Action items: prefer bullet lines like '- Owner: task (due if stated)'.",
    "- Keep the whole summary under about 400 words.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Summarize this meeting transcript for email.\n\n---\n" + clipped,
        },
      ],
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.error?.message || `OpenAI responded ${response.status}`;
    throw new Error(message);
  }
  const summary = body.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error("OpenAI returned an empty summary");
  }
  return summary;
}

module.exports = { summarize };
