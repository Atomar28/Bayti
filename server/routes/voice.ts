import express from 'express';
import twilio from 'twilio';
import { db } from '../db';
import { campaigns, campaignLeads, campaignCallLogs, callScripts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { renderAgentUtterance, processScriptPlaceholders } from '../services/llm';
import { toSSML } from '../services/ssml';
import { ttsService } from '../services/tts';
import { generateTwiML, generateOptOutTwiML } from '../services/telephony';
import { recordOptOut } from '../services/compliance';

const router = express.Router();

// POST /api/voice/twiml - Generate TwiML for campaign calls
router.post('/twiml', async (req, res) => {
  try {
    const { campaignId, leadId } = req.query;
    
    if (!campaignId || !leadId) {
      return res.status(400).type('text/xml').send(generateTwiML());
    }
    
    // Fetch campaign and lead data
    const [campaign] = await db
      .select({
        campaign: campaigns,
        script: callScripts
      })
      .from(campaigns)
      .leftJoin(callScripts, eq(campaigns.scriptId, callScripts.id))
      .where(eq(campaigns.id, campaignId as string))
      .limit(1);
    
    const [lead] = await db
      .select()
      .from(campaignLeads)
      .where(eq(campaignLeads.id, leadId as string))
      .limit(1);
    
    if (!campaign || !lead) {
      console.error(`Campaign or lead not found: ${campaignId}, ${leadId}`);
      return res.status(404).type('text/xml').send(generateTwiML());
    }
    
    // Update lead status to CONNECTED
    await db
      .update(campaignLeads)
      .set({
        status: 'CONNECTED',
        updatedAt: new Date()
      })
      .where(eq(campaignLeads.id, leadId as string));
    
    // Prepare lead context for script rendering
    const leadContext = {
      fullName: lead.fullName,
      phoneE164: lead.phoneE164,
      email: lead.email,
      notes: lead.notes,
      custom: lead.custom as Record<string, any>,
      campaignName: campaign.campaign.name,
      scriptContent: campaign.script?.content,
    };
    
    // Generate agent utterance
    const agentText = await renderAgentUtterance(leadContext);
    
    // Convert to SSML with humanization
    const ssml = toSSML(agentText, {
      rate: 'medium',
      pitch: 'medium',
      addAcknowledgements: true,
      addPauses: true,
      emphasizeValues: true,
    });
    
    // Try to get audio URL from TTS service
    let audioUrl;
    try {
      audioUrl = await ttsService.getStreamingUrl(ssml, {
        voiceId: 'iP95p4xoKVk53GoZ742B', // British male voice
        stability: 0.4,
        similarityBoost: 0.7,
        style: 0.3,
        speakerBoost: true,
      });
    } catch (error) {
      console.warn('TTS synthesis failed, using Twilio TTS:', error);
    }
    
    // Generate TwiML
    const twiml = generateTwiML(audioUrl || undefined, ssml);
    
    // Log the interaction
    await db
      .insert(campaignCallLogs)
      .values({
        leadId: leadId as string,
        status: 'connected',
        metadata: {
          campaignId: campaignId as string,
          agentText,
          ssml: audioUrl ? undefined : ssml, // Only store SSML if no audio URL
          audioUrl,
        }
      })
      .onConflictDoNothing(); // Avoid duplicates
    
    res.type('text/xml').send(twiml);
    
  } catch (error) {
    console.error('TwiML generation error:', error);
    res.type('text/xml').send(generateTwiML());
  }
});

// POST /api/voice/gather - Handle user input (DTMF or speech)
router.post('/gather', async (req, res) => {
  try {
    const { Digits, SpeechResult, CallSid } = req.body;
    
    console.log(`Gather response - CallSid: ${CallSid}, Digits: ${Digits}, Speech: ${SpeechResult}`);
    
    // Check for opt-out (digit 9 or speech containing "stop")
    const isOptOut = Digits === '9' || 
                     (SpeechResult && SpeechResult.toLowerCase().includes('stop'));
    
    if (isOptOut) {
      // Find the lead by call SID
      const [lead] = await db
        .select()
        .from(campaignLeads)
        .where(eq(campaignLeads.lastCallSid, CallSid))
        .limit(1);
      
      if (lead) {
        // Add to suppression list
        await recordOptOut(lead.phoneE164, 'User requested opt-out during call');
        
        // Update lead status
        await db
          .update(campaignLeads)
          .set({
            status: 'DO_NOT_CALL',
            lastError: 'User opted out during call',
            updatedAt: new Date()
          })
          .where(eq(campaignLeads.id, lead.id));
        
        // Log the opt-out
        await db
          .insert(campaignCallLogs)
          .values({
            leadId: lead.id,
            callSid: CallSid,
            status: 'opted_out',
            metadata: {
              optOutMethod: Digits === '9' ? 'dtmf' : 'speech',
              userInput: Digits || SpeechResult,
            }
          });
      }
      
      // Return opt-out TwiML
      return res.type('text/xml').send(generateOptOutTwiML());
    }
    
    // Continue with normal conversation flow
    // For now, just thank them and hang up
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({
      voice: 'Polly.Matthew-Neural',
      language: 'en-US'
    }, 'Thank you for your time. We will follow up with more information soon. Have a great day!');
    twiml.hangup();
    
    // Update lead status to completed
    if (CallSid) {
      const [lead] = await db
        .select()
        .from(campaignLeads)
        .where(eq(campaignLeads.lastCallSid, CallSid))
        .limit(1);
      
      if (lead) {
        await db
          .update(campaignLeads)
          .set({
            status: 'COMPLETED',
            updatedAt: new Date()
          })
          .where(eq(campaignLeads.id, lead.id));
        
        // Log completion
        await db
          .insert(campaignCallLogs)
          .values({
            leadId: lead.id,
            callSid: CallSid,
            status: 'completed',
            metadata: {
              userInput: Digits || SpeechResult,
              completedAt: new Date().toISOString(),
            }
          });
      }
    }
    
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('Gather handling error:', error);
    
    // Fallback TwiML
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Thank you for your time. Goodbye.');
    twiml.hangup();
    
    res.type('text/xml').send(twiml.toString());
  }
});

// POST /api/voice/recording-status - Handle recording status webhook
router.post('/recording-status', async (req, res) => {
  try {
    const { CallSid, RecordingUrl, RecordingDuration } = req.body;
    
    console.log(`Recording status - CallSid: ${CallSid}, URL: ${RecordingUrl}, Duration: ${RecordingDuration}`);
    
    // Find the lead and update call log with recording info
    const [lead] = await db
      .select()
      .from(campaignLeads)
      .where(eq(campaignLeads.lastCallSid, CallSid))
      .limit(1);
    
    if (lead) {
      // Update the latest call log for this lead
      await db
        .update(campaignCallLogs)
        .set({
          recordingUrl: RecordingUrl,
          durationSec: parseInt(RecordingDuration) || 0,
          metadata: sql`
            COALESCE(metadata, '{}') || 
            '{"recordingUpdated": "' || ${new Date().toISOString()} || '"}'
          `
        })
        .where(eq(campaignCallLogs.leadId, lead.id));
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Recording status error:', error);
    res.status(200).send('OK'); // Always return 200 to Twilio
  }
});

// POST /api/voice/status - Handle call status webhook  
router.post('/status', async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;
    
    console.log(`Call status - CallSid: ${CallSid}, Status: ${CallStatus}, Duration: ${CallDuration}`);
    
    // Find the lead and update status
    const [lead] = await db
      .select()
      .from(campaignLeads)
      .where(eq(campaignLeads.lastCallSid, CallSid))
      .limit(1);
    
    if (lead) {
      let leadStatus = 'COMPLETED';
      
      // Map Twilio call status to lead status
      switch (CallStatus) {
        case 'completed':
          leadStatus = 'COMPLETED';
          break;
        case 'no-answer':
          leadStatus = 'RETRY';
          break;
        case 'busy':
        case 'failed':
          leadStatus = lead.attempts >= 2 ? 'FAILED' : 'RETRY';
          break;
        case 'canceled':
          leadStatus = 'FAILED';
          break;
      }
      
      // Update lead status
      await db
        .update(campaignLeads)
        .set({
          status: leadStatus,
          lastError: CallStatus === 'failed' ? 'Call failed' : null,
          updatedAt: new Date()
        })
        .where(eq(campaignLeads.id, lead.id));
      
      // Update call log
      await db
        .update(campaignCallLogs)
        .set({
          status: CallStatus,
          durationSec: parseInt(CallDuration) || 0,
        })
        .where(eq(campaignCallLogs.leadId, lead.id));
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Call status error:', error);
    res.status(200).send('OK'); // Always return 200 to Twilio
  }
});

export default router;