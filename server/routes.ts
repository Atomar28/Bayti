import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCallLogSchema, insertLeadSchema, insertCallScriptSchema, insertAgentSettingsSchema, insertAppointmentSchema, insertProjectScriptSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";
import twilio from "twilio";
import OpenAI from "openai";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { elevenLabsService } from "./elevenlabs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client for AI conversation
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Store conversation context for each call
const conversationContexts = new Map<string, Array<{role: string, content: string}>>();

// Generate alternative appointment times using GPT-4o mini
async function generateAlternativeAppointmentTimes(proposedTime: Date): Promise<string[]> {
  try {
    const prompt = `The proposed appointment time ${proposedTime.toISOString()} is not available. Generate 2 alternative appointment times within the next 3 days during business hours (9 AM - 6 PM). Return only the times as an array of ISO date strings.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }] as any,
      max_tokens: 100,
      temperature: 0.3,
    });
    
    const response = completion.choices[0]?.message?.content || "";
    
    // Parse the response and generate actual alternative times
    const now = new Date();
    const alternatives = [];
    
    // Add 1 day and same time
    const alt1 = new Date(proposedTime);
    alt1.setDate(alt1.getDate() + 1);
    alternatives.push(alt1.toISOString());
    
    // Add 2 days and same time  
    const alt2 = new Date(proposedTime);
    alt2.setDate(alt2.getDate() + 2);
    alternatives.push(alt2.toISOString());
    
    return alternatives;
  } catch (error) {
    console.error("Error generating alternative times:", error);
    // Fallback alternatives
    const alt1 = new Date(proposedTime);
    alt1.setDate(alt1.getDate() + 1);
    const alt2 = new Date(proposedTime);
    alt2.setDate(alt2.getDate() + 2);
    return [alt1.toISOString(), alt2.toISOString()];
  }
}

// Process script placeholders with lead/project data
function processScriptPlaceholders(scriptContent: string, placeholders: {[key: string]: string}): string {
  let processedScript = scriptContent;
  
  // Replace placeholders like {lead_name}, {project_name}, {price}
  Object.entries(placeholders).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    processedScript = processedScript.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return processedScript;
}

// Enhanced AI response with script integration
async function generateAIResponseWithScript(userInput: string, callSid: string, projectId?: string, leadData?: any): Promise<string> {
  try {
    console.log(`Generating AI response for call ${callSid} with input: "${userInput}"`);
    
    // Get or initialize conversation context
    let context = conversationContexts.get(callSid) || [];
    
    // Check if there's a custom script for this project
    let systemPrompt = "You are Bayti, an expert real estate AI assistant specializing in Dubai and UAE properties. You help clients find homes, apartments, villas, and investment properties. Be conversational, helpful, and ask relevant follow-up questions about budget, location preferences, property type, bedrooms, and timeline. Always respond to exactly what the user said and ask natural follow-up questions. Keep responses concise (under 100 words) and natural for phone conversations. Never repeat previous responses.";
    
    if (projectId) {
      try {
        const projectScript = await storage.getProjectScript(projectId);
        if (projectScript) {
          // Process placeholders with actual lead data
          const placeholders = {
            lead_name: leadData?.name || "valued client",
            project_name: projectScript.projectName,
            price: projectScript.placeholders?.price || "competitive pricing",
            ...projectScript.placeholders
          };
          
          const processedScript = processScriptPlaceholders(projectScript.scriptContent, placeholders);
          systemPrompt = `You are Bayti, a real estate AI assistant. Use this custom script as guidance for the conversation: ${processedScript}. Adapt the script naturally to the conversation flow while maintaining the key points and information.`;
          console.log(`Using custom script for project ${projectId}`);
        }
      } catch (error) {
        console.log(`No custom script found for project ${projectId}, using default AI flow`);
      }
    }
    
    // Initialize with system prompt if this is the first message
    if (context.length === 0) {
      context.push({
        role: "system",
        content: systemPrompt
      });
    }
    
    // Add user input to context
    context.push({ role: "user", content: userInput });
    
    // Generate response using GPT-4o mini
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: context as any,
      max_tokens: 120,
      temperature: 0.8,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || "I'd be happy to help you find the perfect property. Could you tell me more about what you're looking for?";
    
    // Add AI response to context
    context.push({ role: "assistant", content: aiResponse });
    
    // Keep only last 8 messages to manage context length
    if (context.length > 9) {
      context = [context[0], ...context.slice(-8)];
    }
    
    // Update conversation context
    conversationContexts.set(callSid, context);
    
    console.log(`AI response generated: "${aiResponse}"`);
    return aiResponse;
    
  } catch (error) {
    console.error("Error generating AI response:", error);
    const fallbacks = [
      "I'm here to help you find the perfect property. What type of home interests you?",
      "Could you tell me more about what you're looking for in a property?",
      "What kind of property are you interested in today?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// Generate intelligent AI response using GPT-4o mini
async function generateAIResponse(userInput: string, callSid: string): Promise<string> {
  try {
    console.log(`Generating AI response for call ${callSid} with input: "${userInput}"`);
    
    // Get or initialize conversation context
    let context = conversationContexts.get(callSid) || [];
    
    // Initialize with system prompt if this is the first message
    if (context.length === 0) {
      let systemPrompt = "You are Bayti, an expert real estate AI assistant specializing in Dubai and UAE properties. You help clients find homes, apartments, villas, and investment properties. Be conversational, helpful, and ask relevant follow-up questions about budget, location preferences, property type, bedrooms, and timeline. Always respond to exactly what the user said and ask natural follow-up questions. Keep responses concise (under 100 words) and natural for phone conversations. Never repeat previous responses.";
      
      try {
        // Get the currently active script for system prompt
        const activeScript = await storage.getActiveProjectScript();
        if (activeScript) {
          // Process placeholders for the script
          const placeholders = {
            lead_name: "valued client",
            project_name: activeScript.projectName,
            ...activeScript.placeholders
          };
          
          const processedScript = processScriptPlaceholders(activeScript.scriptContent, placeholders);
          systemPrompt = `You are a sales agent for ${activeScript.projectName}. Use this script as guidance for the conversation: ${processedScript}. Adapt the script naturally to the conversation flow while maintaining the key points and information. Be conversational and respond naturally to what the caller says. Keep responses concise (under 100 words) and natural for phone conversations.`;
          console.log(`Using active script system prompt for: ${activeScript.projectName}`);
        } else {
          console.log('No active script found, using default system prompt');
        }
      } catch (error) {
        console.log('Error fetching active script, using default system prompt:', error);
      }
      
      context.push({
        role: "system",
        content: systemPrompt
      });
    }
    
    // Add user input to context
    context.push({ role: "user", content: userInput });
    
    // Generate response using GPT-4o mini
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: context as any,
      max_tokens: 120,
      temperature: 0.8,
      presence_penalty: 0.6, // Encourage varied responses
      frequency_penalty: 0.3, // Reduce repetition
    });
    
    const aiResponse = completion.choices[0]?.message?.content || "I'd be happy to help you find the perfect property. Could you tell me more about what you're looking for?";
    
    // Add AI response to context
    context.push({ role: "assistant", content: aiResponse });
    
    // Keep only last 8 messages to manage context length
    if (context.length > 9) {
      context = [context[0], ...context.slice(-8)];
    }
    
    // Update conversation context
    conversationContexts.set(callSid, context);
    
    console.log(`AI response generated: "${aiResponse}"`);
    return aiResponse;
    
  } catch (error) {
    console.error("Error generating AI response:", error);
    // Different fallback responses to avoid repetition
    const fallbacks = [
      "I'm here to help you find the perfect property. What type of home interests you?",
      "Could you tell me more about what you're looking for in a property?",
      "What kind of property are you interested in today?",
      "I'd love to help with your property search. What are your requirements?"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from attached_assets
  app.use('/attached_assets', express.static(path.join(__dirname, '..', 'attached_assets')));
  // Call Logs endpoints
  app.get("/api/call-logs", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      
      const result = await storage.getCallLogs(page, limit, search, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch call logs", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/call-logs/:id", async (req, res) => {
    try {
      const callLog = await storage.getCallLog(req.params.id);
      if (!callLog) {
        return res.status(404).json({ message: "Call log not found" });
      }
      res.json(callLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch call log", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/call-logs", async (req, res) => {
    try {
      const validatedData = insertCallLogSchema.parse(req.body);
      const callLog = await storage.createCallLog(validatedData);
      res.status(201).json(callLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create call log", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/call-logs/:id", async (req, res) => {
    try {
      const updates = insertCallLogSchema.partial().parse(req.body);
      const callLog = await storage.updateCallLog(req.params.id, updates);
      if (!callLog) {
        return res.status(404).json({ message: "Call log not found" });
      }
      res.json(callLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update call log", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Leads endpoints
  app.get("/api/leads", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getLeads(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const updates = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, updates);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Call Scripts endpoints
  app.get("/api/call-scripts", async (req, res) => {
    try {
      const scripts = await storage.getCallScripts();
      res.json(scripts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch call scripts", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/call-scripts", async (req, res) => {
    try {
      const validatedData = insertCallScriptSchema.parse(req.body);
      const script = await storage.createCallScript(validatedData);
      res.status(201).json(script);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create call script", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/call-scripts/:id", async (req, res) => {
    try {
      const updates = insertCallScriptSchema.partial().parse(req.body);
      const script = await storage.updateCallScript(req.params.id, updates);
      if (!script) {
        return res.status(404).json({ message: "Call script not found" });
      }
      res.json(script);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update call script", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/call-scripts/:id", async (req, res) => {
    try {
      const success = await storage.deleteCallScript(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Call script not found" });
      }
      res.json({ message: "Call script deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete call script", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Agent Settings endpoints
  app.get("/api/agent-settings/:agentId", async (req, res) => {
    try {
      const settings = await storage.getAgentSettings(req.params.agentId);
      if (!settings) {
        return res.status(404).json({ message: "Agent settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent settings", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/agent-settings", async (req, res) => {
    try {
      const validatedData = insertAgentSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateAgentSettings(validatedData);
      
      // Update ElevenLabs voice settings if voice configuration changed
      if (validatedData.elevenLabsVoiceId && validatedData.voiceSettings) {
        try {
          await elevenLabsService.updateVoiceSettings(
            validatedData.elevenLabsVoiceId,
            {
              stability: validatedData.voiceSettings.stability,
              similarityBoost: validatedData.voiceSettings.similarityBoost,
              style: typeof validatedData.voiceSettings.style === 'number' ? validatedData.voiceSettings.style : 0,
              speakerBoost: typeof validatedData.voiceSettings.speakerBoost === 'boolean' ? validatedData.voiceSettings.speakerBoost : false
            }
          );
        } catch (voiceError) {
          console.warn("Failed to update ElevenLabs voice settings:", voiceError);
          // Continue with saving settings even if voice update fails
        }
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Agent settings save error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save agent settings", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // ElevenLabs Voice API Routes
  app.get("/api/elevenlabs/voices", async (req, res) => {
    try {
      const voices = await elevenLabsService.getVoices();
      res.json(voices);
    } catch (error) {
      console.error("Error fetching voices:", error);
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });

  app.get("/api/elevenlabs/models", async (req, res) => {
    try {
      const models = await elevenLabsService.getModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  app.post("/api/elevenlabs/test-voice", async (req, res) => {
    try {
      const { voiceId, text, modelId } = req.body;
      if (!voiceId) {
        return res.status(400).json({ message: "Voice ID required" });
      }
      
      // Use very short text to minimize credit usage
      const testText = text || "Hi";
      const audioBase64 = await elevenLabsService.testVoice(voiceId, testText, modelId);
      res.json({ audioUrl: audioBase64 });
    } catch (error) {
      console.error("Error testing voice:", error);
      res.status(500).json({ message: "Failed to test voice" });
    }
  });

  // Analytics endpoints
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getCallStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Export endpoints
  app.get("/api/export/call-logs", async (req, res) => {
    try {
      const { callLogs } = await storage.getCallLogs(1, 1000); // Export all
      
      const csv = [
        "Date,Phone Number,Duration,Status,Recording URL,Notes",
        ...callLogs.map(log => [
          log.startTime?.toISOString().split('T')[0] || '',
          log.phoneNumber,
          log.duration ? `${Math.floor(log.duration / 60)}:${(log.duration % 60).toString().padStart(2, '0')}` : '',
          log.status,
          log.recordingUrl || '',
          log.notes || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=call-logs.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export call logs", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/export/leads", async (req, res) => {
    try {
      const { leads } = await storage.getLeads(1, 1000); // Export all
      
      const csv = [
        "Name,Company,Phone,Email,Budget,Interest Level,Status,Industry,Company Size,Last Contact",
        ...leads.map(lead => [
          lead.name,
          lead.company || '',
          lead.phoneNumber,
          lead.email || '',
          lead.budget || '',
          lead.interestLevel?.toString() || '0',
          lead.status || '',
          lead.industry || '',
          lead.companySize || '',
          lead.lastContactDate?.toISOString().split('T')[0] || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export leads", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Twilio call status webhook to handle dropped calls
  app.post("/api/ai/call-status", async (req, res) => {
    try {
      const { CallSid, CallStatus, CallDuration } = req.body;
      console.log(`Call status webhook: ${CallSid} - ${CallStatus}`);
      
      // Find the call log by call SID
      const result = await storage.getCallLogs(1, 100);
      const callLog = result.callLogs.find(log => log.notes?.includes(CallSid));
      
      if (callLog) {
        let status = 'completed';
        
        // Handle different call statuses
        switch (CallStatus) {
          case 'no-answer':
          case 'failed':
          case 'busy':
          case 'canceled':
            status = 'failed';
            break;
          case 'completed':
            // Only mark as completed if it actually had a conversation
            status = callLog.status === 'qualified' ? 'qualified' : 'completed';
            break;
        }
        
        // Update call log with final status and duration
        await storage.updateCallLog(callLog.id, {
          status: status as any,
          duration: CallDuration ? parseInt(CallDuration) : callLog.duration,
          endTime: new Date()
        });
        
        console.log(`Updated call ${CallSid}: status=${status}, duration=${CallDuration}s`);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Call status webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // AI Calling Integration - Direct Node.js implementation
  app.post("/api/ai/make-test-call", async (req, res) => {
    try {
      const { to_number } = req.body;
      
      if (!to_number) {
        return res.status(400).json({ error: "Phone number required" });
      }

      // Initialize Twilio client
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      // Get the current replit domain for webhook URL
      const replit_domain = process.env.REPLIT_DOMAINS?.split(",")[0];
      if (!replit_domain) {
        return res.status(500).json({ error: "Replit domain not configured" });
      }
      
      const webhook_url = `https://${replit_domain}/api/ai/incoming-call`;

      console.log(`Making call to ${to_number} with webhook URL: ${webhook_url}`);

      const call = await client.calls.create({
        url: webhook_url,
        to: to_number,
        from: process.env.TWILIO_PHONE_NUMBER || "",
        statusCallback: `https://${replit_domain}/api/ai/call-status`,
        statusCallbackEvent: ['completed', 'no-answer', 'failed', 'busy', 'canceled'],
        statusCallbackMethod: 'POST'
      });

      // Store call in database
      await storage.createCallLog({
        phoneNumber: to_number,
        status: 'initiated',
        startTime: new Date(),
        notes: `Test call initiated via Twilio SID: ${call.sid}`
      });

      res.json({
        message: "Test call initiated successfully",
        call_sid: call.sid,
        status: "initiated"
      });

    } catch (error) {
      console.error("Test call error:", error);
      res.status(500).json({ message: "Failed to make test call", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/ai/call-logs", async (req, res) => {
    try {
      // Get AI call logs from main database - filter for test calls
      const result = await storage.getCallLogs(1, 50, undefined, undefined);
      
      // Format for AI calling dashboard
      const aiCalls = result.callLogs
        .filter(log => log.notes?.includes('Bayti AI') || log.notes?.includes('Test call'))
        .map(log => ({
          id: log.id,
          caller_number: log.phoneNumber,
          call_status: log.status,
          created_at: log.startTime,
          duration: log.duration || 0,
          transcription: log.notes || '',
          ai_response: 'Real estate assistance provided'
        }));

      res.json({ calls: aiCalls });
    } catch (error) {
      console.error("AI call logs error:", error);
      res.status(500).json({ message: "Failed to fetch AI call logs", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Twilio webhook for incoming calls
  app.post("/api/ai/incoming-call", async (req, res) => {
    try {
      const { CallSid, From, To } = req.body;
      
      console.log(`Incoming call from ${From}, SID: ${CallSid}`);

      // Store call in database with call start tracking
      const callStartTime = new Date();
      await storage.createCallLog({
        phoneNumber: From,
        status: 'incoming',
        startTime: callStartTime,
        notes: `Bayti AI call from ${From}, SID: ${CallSid}`
      });
      
      console.log(`Call started at ${callStartTime.toISOString()} for ${From}`);

      // Initialize conversation context for this call
      conversationContexts.set(CallSid, []);
      console.log(`Initialized conversation context for call ${CallSid}`);
      
      // Get active script for initial greeting if available
      let greeting = "Hello! You've reached Bayti, your AI real estate assistant. I'm here to help you find your perfect home in Dubai and the UAE. How can I assist you today?";
      
      try {
        // Get the currently active script
        const activeScript = await storage.getActiveProjectScript();
        if (activeScript) {
          // Process placeholders in script content
          const placeholders = {
            lead_name: "valued client",
            project_name: activeScript.projectName,
            ...activeScript.placeholders
          };
          
          // Use the first line or opening of the script as greeting
          const scriptLines = activeScript.scriptContent.split('\n').filter(line => line.trim());
          if (scriptLines.length > 0) {
            greeting = processScriptPlaceholders(scriptLines[0], placeholders);
            console.log(`Using active script greeting: ${activeScript.projectName}`);
          }
        } else {
          console.log('No active script found, using default greeting');
        }
      } catch (error) {
        console.log('Error fetching active script, using default greeting:', error);
      }
      
      // Return TwiML response for AI conversation
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="10" speechTimeout="auto" action="/api/ai/process-speech?call_sid=${CallSid}" method="POST">
        <Say voice="Polly.Joanna">${greeting.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't hear anything. Please call back when you're ready to speak. Goodbye!</Say>
    <Hangup/>
</Response>`;

      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);

    } catch (error) {
      console.error('Incoming call error:', error);
      res.status(500).send('Error processing call');
    }
  });

  app.post("/api/ai/process-speech", async (req, res) => {
    try {
      const { CallSid, SpeechResult } = req.body;
      const call_sid = req.query.call_sid as string;
      
      console.log(`Processing speech for call ${call_sid}: "${SpeechResult}"`);
      console.log(`Speech confidence: ${req.body.Confidence || 'N/A'}`);

      // Validate speech input
      if (!SpeechResult || SpeechResult.trim().length === 0) {
        console.log(`No valid speech detected for call ${call_sid}`);
        // Check if this is a repeated empty response
        const context = conversationContexts.get(call_sid) || [];
        const emptyCount = context.filter(msg => msg.role === 'user' && (!msg.content || msg.content.trim().length === 0)).length;
        
        if (emptyCount >= 2) {
          // Too many empty responses, end call gracefully
          const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">I'm having trouble hearing you clearly. Please feel free to call back when you have a better connection. Thank you for calling Bayti!</Say>
    <Hangup/>
</Response>`;
          res.set('Content-Type', 'application/xml');
          return res.send(twimlResponse);
        }
        // No speech detected, ask again
        const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="15" speechTimeout="auto" action="/api/ai/process-speech?call_sid=${call_sid}" method="POST">
        <Say voice="Polly.Joanna">I didn't catch that. Could you please tell me what type of property you're looking for?</Say>
    </Gather>
    <Say voice="Polly.Joanna">Thank you for calling Bayti. Feel free to call back anytime. Goodbye!</Say>
    <Hangup/>
</Response>`;

        res.set('Content-Type', 'application/xml');
        return res.send(twimlResponse);
      }

      // Generate intelligent AI response using GPT-4o mini
      const aiResponse = await generateAIResponse(SpeechResult, call_sid);

      // Find and update the call log
      const result = await storage.getCallLogs(1, 100);
      const callLog = result.callLogs.find(log => log.notes?.includes(call_sid));
      
      if (callLog) {
        const updatedNotes = `${callLog.notes}\nTranscription: ${SpeechResult}\nAI Response: ${aiResponse}`;
        
        // Calculate call duration from start time
        const now = new Date();
        const startTime = callLog.startTime;
        const duration = Math.round((now.getTime() - startTime.getTime()) / 1000);
        
        // Check if this conversation indicates an appointment booking or qualified lead
        const conversationText = updatedNotes.toLowerCase();
        let callStatus = 'completed';
        let leadCreated = false;
        
        // Look for appointment booking indicators
        if (conversationText.includes('book') || conversationText.includes('schedule') || 
            conversationText.includes('appointment') || conversationText.includes('callback') ||
            conversationText.includes('tomorrow') || conversationText.includes('p.m.') ||
            conversationText.includes('call back')) {
          
          callStatus = 'qualified';
          
          // Extract lead information from conversation
          const nameMatch = updatedNotes.match(/my name is ([a-zA-Z]+)/i);
          const timeMatch = updatedNotes.match(/(\d{1,2})\s?p\.?m\.?/i) || updatedNotes.match(/(\d{1,2}:\d{2})/);
          const phoneNumber = callLog.phoneNumber;
          
          if (nameMatch && phoneNumber) {
            const leadName = nameMatch[1];
            
            // Check if lead already exists for this phone number to prevent duplicates
            const existingLeads = await storage.getLeads();
            const existingLead = existingLeads.leads.find(lead => 
              lead.phoneNumber === phoneNumber || lead.name === leadName
            );
            
            if (!existingLead) {
              // Create lead record only if it doesn't exist
              try {
                const newLead = await storage.createLead({
                  name: leadName,
                  phoneNumber: phoneNumber,
                  status: 'qualified',
                  notes: `Qualified lead from AI conversation. Requested callback/appointment.`,
                  interestLevel: 5
                });
              
                // Create appointment record if time was mentioned
                if (timeMatch) {
                  const scheduledTime = new Date();
                  scheduledTime.setDate(scheduledTime.getDate() + 1); // Tomorrow
                  
                  if (timeMatch[1].includes(':')) {
                    const [hour, minute] = timeMatch[1].split(':');
                    scheduledTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
                  } else {
                    scheduledTime.setHours(parseInt(timeMatch[1]), 0, 0, 0);
                  }
                  
                  await storage.createAppointment({
                    leadId: newLead.id,
                    callLogId: callLog.id,
                    title: `Callback for ${leadName}`,
                    description: 'AI-scheduled callback for property inquiry',
                    scheduledTime: scheduledTime,
                    duration: 30,
                    status: 'scheduled',
                    appointmentType: 'callback'
                  });
                  
                  console.log(`Created appointment for ${leadName} at ${scheduledTime}`);
                }
                
                leadCreated = true;
                console.log(`Created qualified lead for ${leadName}: ${newLead.id}`);
                
              } catch (error) {
                console.error('Error creating lead/appointment:', error);
              }
            } else {
              // Lead already exists, just mark as qualified
              leadCreated = false;
              console.log(`Lead already exists for ${leadName}/${phoneNumber}, skipping duplicate creation`);
            }
          }
        }
        
        await storage.updateCallLog(callLog.id, {
          status: callStatus,
          duration: duration,
          endTime: now,
          notes: updatedNotes
        });
        
        console.log(`Updated call ${call_sid}: duration=${duration}s, status=${callStatus}, lead_created=${leadCreated}`);
      }

      // Return TwiML with AI response and continue conversation
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">${aiResponse.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</Say>
    <Gather input="speech" timeout="8" speechTimeout="auto" partialResultCallback="/api/ai/partial-speech?call_sid=${call_sid}" action="/api/ai/process-speech?call_sid=${call_sid}" method="POST">
        <Say voice="Polly.Joanna"></Say>
    </Gather>
    <Say voice="Polly.Joanna">Thank you for calling Bayti. Have a wonderful day!</Say>
    <Hangup/>
</Response>`;

      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);

    } catch (error) {
      console.error('Speech processing error:', error);
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">I'm sorry, I'm having trouble processing your request. Please try calling back later.</Say>
    <Hangup/>
</Response>`;
      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);
    }
  });

  // Keep original webhook endpoint for backwards compatibility 
  app.post("/api/incoming-call", async (req, res) => {
    try {
      console.log("Incoming call webhook received:", req.body);
      
      // Extract call information from webhook payload
      const {
        phoneNumber,
        callerId,
        callId,
        status = "incoming",
        timestamp = new Date(),
        callerName,
        duration = 0
      } = req.body;

      // Validate required fields
      if (!phoneNumber) {
        return res.status(400).json({ 
          message: "Phone number is required",
          error: "Missing phoneNumber in request body"
        });
      }

      // Create a call log entry for the incoming call
      const callLogData = {
        phoneNumber,
        callerId: callerId || phoneNumber,
        status: status as "incoming" | "answered" | "completed" | "missed" | "failed",
        startTime: new Date(timestamp),
        duration: duration,
        notes: callerName ? `Caller: ${callerName}` : "Incoming call",
        recordingUrl: null,
        leadId: null // Could be populated if caller is a known lead
      };

      const callLog = await storage.createCallLog(callLogData);

      // Return response for webhook
      res.status(200).json({
        message: "Incoming call processed successfully",
        callId: callLog.id,
        status: "received",
        timestamp: new Date(),
        actions: {
          answer: "Call will be handled by AI agent",
          record: "Call recording enabled",
          transcribe: "Real-time transcription active"
        }
      });

    } catch (error) {
      console.error("Error processing incoming call:", error);
      res.status(500).json({ 
        message: "Failed to process incoming call", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get incoming call webhook info
  app.get("/api/incoming-call", async (req, res) => {
    res.json({
      endpoint: "/api/incoming-call",
      method: "POST",
      description: "Webhook endpoint for processing incoming calls to Bayti AI system",
      requiredFields: {
        phoneNumber: "string - Required. The caller's phone number"
      },
      optionalFields: {
        callerId: "string - Caller ID information",
        callId: "string - External call system ID",
        status: "string - Call status (incoming, answered, completed, missed, failed)",
        timestamp: "string - Call timestamp (ISO format)",
        callerName: "string - Name of the caller if known",
        duration: "number - Call duration in seconds"
      },
      responseFormat: {
        message: "Success message",
        callId: "Generated call log ID",
        status: "Processing status",
        timestamp: "Processing timestamp",
        actions: "Available AI agent actions"
      },
      example: {
        request: {
          phoneNumber: "+1234567890",
          callerId: "+1234567890",
          status: "incoming",
          callerName: "John Doe",
          timestamp: "2024-01-01T12:00:00Z"
        },
        response: {
          message: "Incoming call processed successfully",
          callId: "uuid-generated-id",
          status: "received",
          timestamp: "2024-01-01T12:00:00Z",
          actions: {
            answer: "Call will be handled by AI agent",
            record: "Call recording enabled",
            transcribe: "Real-time transcription active"
          }
        }
      }
    });
  });

  // ==================== NEW API ROUTES ====================
  
  // APPOINTMENTS API
  app.get("/api/v1/appointments", async (req, res) => {
    try {
      const { agentId, status } = req.query;
      const appointments = await storage.getAppointments(
        agentId as string, 
        status as string
      );
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/v1/appointment/book", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      // Check for conflicts (basic implementation)
      const existingAppointments = await storage.getAppointments(validatedData.agentId || "default-agent");
      const proposedTime = new Date(validatedData.scheduledTime!);
      const conflictingAppointment = existingAppointments.find(apt => {
        const existingTime = new Date(apt.scheduledTime);
        const timeDiff = Math.abs(existingTime.getTime() - proposedTime.getTime());
        return timeDiff < (apt.duration || 30) * 60 * 1000; // Check buffer time
      });

      if (conflictingAppointment) {
        // Generate alternative times using AI
        const alternativeTimes = await generateAlternativeAppointmentTimes(proposedTime);
        return res.status(409).json({
          message: "Time slot not available",
          conflictingAppointment: conflictingAppointment,
          alternatives: alternativeTimes
        });
      }

      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ message: "Failed to book appointment" });
    }
  });

  app.put("/api/v1/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const appointment = await storage.updateAppointment(id, updates);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // PROJECT SCRIPTS API
  app.get("/api/v1/script/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const script = await storage.getProjectScript(projectId);
      
      if (!script) {
        return res.status(404).json({ message: "No script found for this project" });
      }
      
      res.json(script);
    } catch (error) {
      console.error("Error fetching project script:", error);
      res.status(500).json({ message: "Failed to fetch project script" });
    }
  });

  app.post("/api/v1/script", async (req, res) => {
    try {
      // Add default agentId if not provided
      const scriptData = {
        ...req.body,
        agentId: req.body.agentId || "mock-agent-id" // Default agent ID for now
      };
      
      const validatedData = insertProjectScriptSchema.parse(scriptData);
      const script = await storage.createProjectScript(validatedData);
      res.status(201).json(script);
    } catch (error) {
      console.error("Error creating project script:", error);
      console.error("Request body:", req.body);
      console.error("Script data:", req.body);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      res.status(500).json({ message: "Failed to create project script", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/v1/scripts", async (req, res) => {
    try {
      const { agentId } = req.query;
      const scripts = await storage.getProjectScripts(agentId as string);
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching project scripts:", error);
      res.status(500).json({ message: "Failed to fetch project scripts" });
    }
  });

  app.put("/api/v1/scripts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const script = await storage.updateProjectScript(id, updates);
      
      if (!script) {
        return res.status(404).json({ message: "Project script not found" });
      }
      
      res.json(script);
    } catch (error) {
      console.error("Error updating project script:", error);
      res.status(500).json({ message: "Failed to update project script" });
    }
  });

  app.delete("/api/v1/scripts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProjectScript(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project script not found" });
      }
      
      res.json({ message: "Project script deleted successfully" });
    } catch (error) {
      console.error("Error deleting project script:", error);
      res.status(500).json({ message: "Failed to delete project script" });
    }
  });

  app.post("/api/v1/scripts/:id/activate", async (req, res) => {
    try {
      const script = await storage.setActiveProjectScript(req.params.id);
      if (!script) {
        return res.status(404).json({ message: "Project script not found" });
      }
      res.json({ message: "Project script activated successfully", script });
    } catch (error) {
      console.error("Error activating project script:", error);
      res.status(500).json({ message: "Failed to activate project script", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/v1/scripts/active", async (req, res) => {
    try {
      const activeScript = await storage.getActiveProjectScript();
      res.json({ activeScript });
    } catch (error) {
      console.error("Error fetching active project script:", error);
      res.status(500).json({ message: "Failed to fetch active project script", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Landing page route
  app.get("/landing", (req, res) => {
    res.sendFile("landing.html", { root: "client" });
  });
  
  // Auth page route
  app.get("/auth", (req, res) => {
    res.sendFile("auth.html", { root: "client" });
  });
  
  // Also serve at root for marketing
  app.get("/home", (req, res) => {
    res.sendFile("landing.html", { root: "client" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
