import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (!twilioClient) {
  console.warn('Twilio credentials not configured - campaign calling will not work');
}

export interface CallOptions {
  to: string;
  campaignId: string;
  leadId: string;
  timeout?: number;
  machineDetection?: boolean;
}

// Make an outbound call via Twilio
export async function makeCall(options: CallOptions): Promise<string | null> {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }
  
  if (!process.env.TWILIO_PHONE_NUMBER) {
    throw new Error('TWILIO_PHONE_NUMBER not configured');
  }
  
  try {
    const call = await twilioClient.calls.create({
      to: options.to,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/voice/twiml?campaignId=${options.campaignId}&leadId=${options.leadId}`,
      statusCallback: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      timeout: options.timeout || 30,
      machineDetection: options.machineDetection ? 'Enable' : undefined,
      record: true,
      recordingStatusCallback: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/voice/recording-status`,
    });
    
    console.log(`Call initiated: ${call.sid} to ${options.to}`);
    return call.sid;
  } catch (error) {
    console.error('Failed to make call:', error);
    throw new Error(`Failed to initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get call status from Twilio
export async function getCallStatus(callSid: string): Promise<any> {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }
  
  try {
    const call = await twilioClient.calls(callSid).fetch();
    return {
      sid: call.sid,
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
      price: call.price,
    };
  } catch (error) {
    console.error(`Failed to get call status for ${callSid}:`, error);
    return null;
  }
}

// Generate TwiML for campaign calls
export function generateTwiML(audioUrl?: string, ssml?: string): string {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Gather user input (speech or DTMF)
  const gather = twiml.gather({
    input: ['speech', 'dtmf'],
    timeout: 10,
    speechTimeout: 'auto',
    action: '/api/voice/gather',
    method: 'POST',
    numDigits: 1,
  });
  
  if (audioUrl) {
    // Use ElevenLabs audio if available
    gather.play(audioUrl);
  } else if (ssml) {
    // Use SSML with Twilio's TTS
    gather.say({
      voice: 'Polly.Matthew-Neural',
      language: 'en-US'
    }, ssml);
  } else {
    // Fallback greeting
    gather.say({
      voice: 'Polly.Matthew-Neural',
      language: 'en-US'
    }, 'Hello, this is an automated call from Bayti Real Estate. I have some exciting property opportunities to share with you. Are you interested in learning more?');
  }
  
  // If no input received, thank and hang up
  twiml.say({
    voice: 'Polly.Matthew-Neural',
    language: 'en-US'
  }, 'Thank you for your time. We will follow up with more information soon. Have a great day!');
  
  twiml.hangup();
  
  return twiml.toString();
}

// Generate opt-out TwiML
export function generateOptOutTwiML(): string {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Matthew-Neural',
    language: 'en-US'
  }, 'Thank you. Your number has been removed from our calling list. You will not receive any more calls from us. Have a good day.');
  
  twiml.hangup();
  
  return twiml.toString();
}

// Validate Twilio webhook signature (for security)
export function validateWebhook(signature: string, url: string, params: any): boolean {
  if (!process.env.TWILIO_AUTH_TOKEN) {
    return false;
  }
  
  try {
    return twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      signature,
      url,
      params
    );
  } catch (error) {
    console.error('Webhook validation failed:', error);
    return false;
  }
}

// Get available Twilio phone numbers
export async function getAvailableNumbers(): Promise<any[]> {
  if (!twilioClient) {
    return [];
  }
  
  try {
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();
    return phoneNumbers.map(number => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: number.capabilities,
    }));
  } catch (error) {
    console.error('Failed to get Twilio numbers:', error);
    return [];
  }
}