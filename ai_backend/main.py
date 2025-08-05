#!/usr/bin/env python3
"""
Bayti AI Calling Backend - FastAPI Integration
Handles incoming calls, AI processing, and voice synthesis
"""

import os
import asyncio
import uuid
from datetime import datetime
from pathlib import Path
import logging

import psycopg2
from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
import openai
from pydub import AudioSegment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Bayti AI Calling Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
DATABASE_URL = os.getenv("DATABASE_URL")

# Initialize clients
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Create audio directory
AUDIO_DIR = Path("audio_files")
AUDIO_DIR.mkdir(exist_ok=True)

# Database connection
def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create ai_calls table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_calls (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            call_sid VARCHAR(255) UNIQUE,
            caller_number VARCHAR(50),
            transcription TEXT,
            ai_response TEXT,
            audio_file_path VARCHAR(255),
            call_status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()

# Call init_db on startup
init_db()

async def transcribe_audio(audio_url: str) -> str:
    """Download and transcribe audio using OpenAI Whisper"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(audio_url)
            audio_data = response.content
        
        # Save temporary audio file
        temp_audio_path = AUDIO_DIR / f"temp_{uuid.uuid4()}.wav"
        with open(temp_audio_path, "wb") as f:
            f.write(audio_data)
        
        # Transcribe with OpenAI Whisper
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        with open(temp_audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        
        # Clean up temp file
        temp_audio_path.unlink()
        
        return transcript.text
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return "I couldn't understand what you said."

async def generate_ai_response(user_message: str, conversation_context: str = "") -> str:
    """Generate AI response using GPT-4o mini"""
    try:
        # Real estate focused AI agent prompt
        system_prompt = """You are a professional AI real estate agent for Bayti. You help clients find their perfect home.

Key conversation flow:
1. Greet warmly and ask what brings them to Bayti today
2. Ask about their preferred location/area
3. Inquire about their budget range
4. Ask about property type preferences (house, condo, etc.)
5. Ask about must-have features
6. Provide helpful guidance and next steps

Keep responses conversational, friendly, and under 50 words. Always end with a relevant follow-up question."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context: {conversation_context}\nUser: {user_message}"}
        ]
        
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=150,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip() if response.choices[0].message.content else "I'm here to help you find your perfect home. What area are you interested in?"
    except Exception as e:
        logger.error(f"AI response error: {e}")
        return "I'm here to help you find your perfect home. What area are you interested in?"

async def text_to_speech(text: str, call_id: str) -> str:
    """Convert text to speech using ElevenLabs Flash v2.5"""
    try:
        url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"  # Adam voice
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        data = {
            "text": text,
            "model_id": "eleven_flash_v2_5",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            audio_path = AUDIO_DIR / f"{call_id}.mp3"
            with open(audio_path, "wb") as f:
                f.write(response.content)
            return str(audio_path)
        else:
            logger.error(f"ElevenLabs error: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        return None

@app.post("/incoming-call")
async def handle_incoming_call(request: Request):
    """Handle incoming Twilio webhook calls"""
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    caller_number = form_data.get("From")
    
    logger.info(f"Incoming call from {caller_number}, SID: {call_sid}")
    
    # Store initial call data
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO ai_calls (call_sid, caller_number, call_status)
        VALUES (%s, %s, %s)
        ON CONFLICT (call_sid) DO NOTHING
    """, (call_sid, caller_number, "incoming"))
    conn.commit()
    cur.close()
    conn.close()
    
    # Create TwiML response for gathering speech
    response = VoiceResponse()
    
    # Welcome message for trial accounts
    welcome_msg = "Hello! You've reached Bayti, your AI real estate assistant. I'm here to help you find your perfect home. Please press any key to continue our conversation, then tell me how I can help you today."
    
    gather = Gather(
        input="speech dtmf",
        timeout=10,
        speech_timeout="auto",
        action=f"/process-speech?call_sid={call_sid}",
        method="POST"
    )
    gather.say(welcome_msg, voice="Polly.Joanna")
    response.append(gather)
    
    # Fallback if no speech detected
    response.say("I didn't hear anything. Please call back when you're ready to speak.", voice="Polly.Joanna")
    response.hangup()
    
    return Response(content=str(response), media_type="application/xml")

@app.post("/process-speech")
async def process_speech(request: Request):
    """Process speech input and generate AI response"""
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    speech_result = str(form_data.get("SpeechResult", ""))
    
    logger.info(f"Processing speech for call {call_sid}: {speech_result}")
    
    if not speech_result:
        # No speech detected, ask again
        response = VoiceResponse()
        gather = Gather(
            input="speech",
            timeout=5,
            speech_timeout="auto",
            action=f"/process-speech?call_sid={call_sid}",
            method="POST"
        )
        gather.say("I didn't catch that. Could you please repeat your question?", voice="Polly.Joanna")
        response.append(gather)
        response.hangup()
        return Response(content=str(response), media_type="application/xml")
    
    # Get conversation context
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT transcription, ai_response FROM ai_calls WHERE call_sid = %s", (call_sid,))
    result = cur.fetchone()
    
    context = ""
    if result and result[0]:
        context = f"Previous: User said '{result[0]}', AI replied '{result[1]}'"
    
    # Generate AI response
    ai_reply = await generate_ai_response(speech_result, context)
    
    # Update database with transcription and AI response
    cur.execute("""
        UPDATE ai_calls 
        SET transcription = COALESCE(transcription || ' | ', '') || %s,
            ai_response = COALESCE(ai_response || ' | ', '') || %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE call_sid = %s
    """, (speech_result, ai_reply, call_sid))
    conn.commit()
    
    # Generate audio file
    audio_path = await text_to_speech(ai_reply, str(call_sid))
    if audio_path:
        cur.execute("""
            UPDATE ai_calls SET audio_file_path = %s WHERE call_sid = %s
        """, (audio_path, call_sid))
        conn.commit()
    
    cur.close()
    conn.close()
    
    # Create TwiML response
    response = VoiceResponse()
    
    # Play AI response
    response.say(ai_reply, voice="Polly.Joanna")
    
    # Continue conversation
    gather = Gather(
        input="speech",
        timeout=5,
        speech_timeout="auto",
        action=f"/process-speech?call_sid={call_sid}",
        method="POST"
    )
    gather.say("What else would you like to know?", voice="Polly.Joanna")
    response.append(gather)
    
    # End call if no further input
    response.say("Thank you for calling Bayti. Have a great day!", voice="Polly.Joanna")
    response.hangup()
    
    return Response(content=str(response), media_type="application/xml")

@app.get("/audio/{call_id}.mp3")
async def serve_audio(call_id: str):
    """Serve generated audio files"""
    audio_path = AUDIO_DIR / f"{call_id}.mp3"
    if audio_path.exists():
        return FileResponse(audio_path, media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio file not found")

@app.post("/make-test-call")
async def make_test_call(request: Request):
    """Make a test outbound call"""
    data = await request.json()
    to_number = data.get("to_number")
    
    if not to_number:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    try:
        # Get the current replit domain for webhook URL  
        replit_domain = os.getenv("REPLIT_DOMAINS", "").split(",")[0] if os.getenv("REPLIT_DOMAINS") else "localhost"
        webhook_url = f"https://{replit_domain}/incoming-call"
        
        logger.info(f"Making call to {to_number} with webhook URL: {webhook_url}")
        
        call = twilio_client.calls.create(
            url=webhook_url,
            to=to_number,
            from_=str(TWILIO_PHONE_NUMBER)
        )
        
        return {"success": True, "call_sid": call.sid, "status": call.status}
    except Exception as e:
        logger.error(f"Outbound call error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/call-logs")
async def get_call_logs():
    """Get recent AI call logs"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, caller_number, transcription, ai_response, call_status, created_at
        FROM ai_calls 
        ORDER BY created_at DESC 
        LIMIT 50
    """)
    
    calls = []
    for row in cur.fetchall():
        calls.append({
            "id": str(row[0]),
            "caller_number": row[1],
            "transcription": row[2],
            "ai_response": row[3],
            "call_status": row[4],
            "created_at": row[5].isoformat() if row[5] else None
        })
    
    cur.close()
    conn.close()
    
    return {"calls": calls}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Bayti AI Calling Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)