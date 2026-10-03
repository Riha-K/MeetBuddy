require("dotenv").config();

const express = require("express");
const { summarize } = require("./summarizer");
const { sendSummary } = require("./emailService");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/summarize", async (req, res) => {
  const transcript = String(req.body?.transcript || "").trim();
  const to = String(req.body?.to || "").trim();
  if (!transcript) {
    res.status(400).json({ error: "transcript is required" });
    return;
  }
  if (!to || !to.includes("@")) {
    res.status(400).json({ error: "to email is required" });
    return;
  }

  try {
    const summary = await summarize(transcript);
    await sendSummary({ to, summary });
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3001);
  app.listen(port, "127.0.0.1", () => {
    console.log(`MeetBuddy server listening on http://127.0.0.1:${port}`);
  });
}

module.exports = app;
