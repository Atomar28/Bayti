# Bayti AI Calling System

A comprehensive AI-powered calling agent system built for real estate professionals. Features Twilio integration, OpenAI processing, and ElevenLabs voice synthesis.

## Features

- **AI-Powered Calling Agent**: Real estate-focused AI that engages customers
- **Real-time Speech Processing**: OpenAI Whisper for transcription
- **Natural Voice Responses**: ElevenLabs text-to-speech synthesis
- **Twilio Integration**: Incoming/outgoing call handling
- **Premium Dashboard**: Real-time call logs and analytics
- **Test Call Functionality**: Direct testing from the dashboard

## Quick Start

### 1. Start Both Servers

The system requires both Node.js and Python servers to run simultaneously:

```bash
# Terminal 1: Start Node.js server (port 5000)
npm run dev

# Terminal 2: Start Python AI backend (port 8000)
cd ai_backend
python3 main.py
```

### 2. Configure Twilio Webhooks

For incoming calls to work, configure your Twilio phone number webhook URL:

1. Go to your Twilio Console
2. Navigate to Phone Numbers > Manage > Active numbers
3. Click on your Twilio phone number
4. Set the webhook URL to: `https://your-repl-domain.replit.dev/incoming-call`
5. Set HTTP method to `POST`

### 3. Environment Variables Required

- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token  
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number (e.g., +1234567890)
- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `DATABASE_URL`: PostgreSQL connection string

## Architecture

### Node.js Frontend/API (Port 5000)
- React dashboard with premium UI
- Express.js API server
- Proxy endpoints to Python backend
- Authentication and session management

### Python AI Backend (Port 8000)
- FastAPI server for AI processing
- Twilio webhook handlers
- OpenAI Whisper transcription
- GPT-4o mini conversation AI
- ElevenLabs voice synthesis
- PostgreSQL call logging

## API Endpoints

### AI Calling Endpoints
- `POST /make-test-call` - Initiate outbound test call
- `POST /incoming-call` - Twilio webhook for incoming calls
- `POST /process-speech` - Process speech during calls
- `GET /call-logs` - Retrieve AI call history
- `GET /health` - Backend health check

### Dashboard API
- `GET /api/ai/call-logs` - Proxy to Python backend
- `POST /api/ai/make-test-call` - Proxy to Python backend

## Usage

1. **Test Calls**: Click "Start Test Call" in the dashboard
2. **Incoming Calls**: Configure Twilio webhook for automatic handling
3. **Call Logs**: View real-time conversations in the dashboard
4. **AI Agent**: Handles real estate inquiries with natural conversation

## Trial Account Notes

For Twilio trial accounts:
- Only verified phone numbers can receive calls
- Calls may require pressing a key to continue
- Limited to trial account restrictions

## Troubleshooting

- Ensure both servers are running on ports 5000 and 8000
- Check that all environment variables are set
- Verify Twilio webhook URL is publicly accessible
- Test with verified phone numbers for trial accounts