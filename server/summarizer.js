async function summarize(transcript) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing in server/.env");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Summarize a meeting transcript. Use short sections for decisions, action items, and open questions. Leave a section out if the transcript does not support it.",
        },
        { role: "user", content: transcript },
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
