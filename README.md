# MeetBuddy

Chrome extension that captures Google Meet captions and sends them to a small Node server. The server summarizes the transcript with OpenAI and emails the summary. It reads the captions already on the page and does not use the microphone.

## What it does

1. Notice when a Google Meet tab is open
2. Turn captions on and keep each line once it stops changing
3. When the meeting ends, or when you press **Send summary**, post the transcript to the local server
4. Summarize it and mail the result

## Stack

- Chrome extension, Manifest V3: Meet page script plus a popup
- Node.js and Express for the API
- OpenAI for the summary
- Nodemailer for mail

## Server

```bash
cd server
npm install
copy .env.example .env
npm start
```

Fill in `server/.env`:

```text
OPENAI_API_KEY=your_openai_api_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

The API listens on `http://127.0.0.1:3001`.

- `GET /health` — server is up
- `POST /api/summarize` — body `{ "transcript", "to" }`, returns the summary after the mail is sent

## Extension

1. Open `chrome://extensions/`
2. Turn on Developer Mode
3. Choose **Load unpacked** and select the `extension` folder
4. Join a Google Meet, open the MeetBuddy popup, and save the email that should receive the summary

Captions have to be visible in Meet. The page script clicks **Turn on captions** when that button is on screen.

## Layout

```text
extension/          # Manifest V3 extension
server/             # summary and email API
```
