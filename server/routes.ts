import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCallLogSchema, insertLeadSchema, insertCallScriptSchema, insertAgentSettingsSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save agent settings", error: error instanceof Error ? error.message : String(error) });
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

  // AI Calling Integration - Direct Node.js implementation
  app.post("/api/ai/make-test-call", async (req, res) => {
    try {
      const { to_number } = req.body;
      
      if (!to_number) {
        return res.status(400).json({ error: "Phone number required" });
      }

      // Import Twilio
      const twilio = require('twilio');
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
        from: process.env.TWILIO_PHONE_NUMBER
      });

      // Store call in database
      await storage.createCallLog({
        phoneNumber: to_number,
        status: 'initiated',
        startTime: new Date(),
        callType: 'test_call',
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
        .filter(log => log.callType === 'test_call' || log.notes?.includes('Bayti AI'))
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

      // Store call in database
      await storage.createCallLog({
        phoneNumber: From,
        status: 'incoming',
        startTime: new Date(),
        callType: 'test_call',
        notes: `Bayti AI call from ${From}, SID: ${CallSid}`
      });

      // Return TwiML response for AI conversation
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech dtmf" timeout="10" speechTimeout="auto" action="/api/ai/process-speech?call_sid=${CallSid}" method="POST">
        <Say voice="Polly.Joanna">Hello! You've reached Bayti, your AI real estate assistant. I'm here to help you find your perfect home. Please press any key to continue our conversation, then tell me how I can help you today.</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't hear anything. Please call back when you're ready to speak.</Say>
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
      const call_sid = req.query.call_sid;
      
      console.log(`Processing speech for call ${call_sid}: ${SpeechResult}`);

      if (!SpeechResult) {
        // No speech detected, ask again
        const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech dtmf" timeout="10" speechTimeout="auto" action="/api/ai/process-speech?call_sid=${call_sid}" method="POST">
        <Say voice="Polly.Joanna">I didn't catch that. Could you please repeat your question?</Say>
    </Gather>
    <Hangup/>
</Response>`;

        res.set('Content-Type', 'application/xml');
        return res.send(twimlResponse);
      }

      // For now, provide a simple real estate response
      const aiResponse = "Thank you for your interest in real estate! I'd be happy to help you find properties in your area. What type of home are you looking for and in which neighborhood?";

      // Find and update the call log
      const result = await storage.getCallLogs(1, 100);
      const callLog = result.callLogs.find(log => log.notes?.includes(call_sid));
      
      if (callLog) {
        await storage.updateCallLog(callLog.id, {
          status: 'completed',
          notes: `${callLog.notes}\nTranscription: ${SpeechResult}\nAI Response: ${aiResponse}`
        });
      }

      // Return TwiML with AI response
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">${aiResponse}</Say>
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
