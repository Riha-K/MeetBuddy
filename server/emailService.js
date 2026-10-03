const nodemailer = require("nodemailer");

function transport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS are required in server/.env");
  }
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendSummary({ to, summary }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport().sendMail({
    from,
    to,
    subject: "MeetBuddy meeting summary",
    text: summary,
  });
}

module.exports = { sendSummary };
