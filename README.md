# AI Meeting Summarizer Chrome Extension

A Chrome extension that automatically captures and summarizes Google Meet conversations using AI, making your meetings more productive and accessible.

## Features

- 🎯 Automatic Google Meet detection
- 🎤 Automatic caption enablement
- 📝 Real-time caption capture
- 🤖 AI-powered meeting summarization
- 📧 Email delivery of meeting summaries
- 🔒 Privacy-focused design

## Technical Stack

- **Frontend:**

  - HTML/CSS/JavaScript
  - Chrome Extension Manifest V3
  - Google Meet DOM manipulation

- **Backend:**

  - Node.js
  - Express.js (for API endpoints)
  - OpenAI GPT API (for summarization)
  - Nodemailer (for email delivery)

- **APIs & Services:**
  - Google Meet Captions API
  - OpenAI API
  - SMTP Email Service

## Project Structure

```
AIMeetingSummarizer/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/
├── server/
│   ├── index.js
│   ├── summarizer.js
│   ├── emailService.js
│   └── package.json
└── README.md
```

## Getting Started

1. Clone the repository
2. Set up the backend:
   ```bash
   cd server
   npm install
   ```
3. Configure environment variables:
   - Create `.env` file in the server directory
   - Add required API keys and configuration
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked" and select the `extension` directory

## How It Works

1. **Meeting Detection:**

   - Extension monitors for new Google Meet tabs
   - Automatically detects when a meeting starts

2. **Caption Management:**

   - Automatically enables captions when meeting starts
   - Captures and stores captions in real-time

3. **Summarization Process:**
   - When meeting ends, captured captions are sent to backend
   - AI processes the content to generate a concise summary
   - Summary is formatted and sent via email

## Required Environment Variables

```
OPENAI_API_KEY=your_openai_api_key
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## Development Roadmap

1. **Phase 1:**

   - Basic Chrome extension setup
   - Google Meet detection
   - Caption enabling functionality

2. **Phase 2:**

   - Caption capture implementation
   - Backend server setup
   - Basic summarization logic

3. **Phase 3:**
   - AI integration for improved summarization
   - Email delivery system
   - UI/UX improvements

## Contributing

Feel free to submit issues and enhancement requests!
