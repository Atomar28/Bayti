import type { Express } from 'express';
import multer from 'multer';
import { db } from '../db';
import { campaigns, campaignLeads, campaignCallLogs, suppressions } from '@shared/schema';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { parseCSV, parseExcel } from '../utils/parseLeads';
import { isSuppressed, recordOptOut } from '../services/compliance';
import { callQueue } from '../queues/calls.queue';
import { nanoid } from 'nanoid';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('csv') || 
        file.mimetype.includes('excel') || 
        file.mimetype.includes('spreadsheet') ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

export function registerCampaignRoutes(app: Express) {
  
  // Get all campaigns
  app.get('/api/campaigns', async (req, res) => {
    try {
      const campaignsList = await db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt));
      
      res.json({ campaigns: campaignsList });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  // Get campaign summary with lead and queue statistics
  app.get('/api/campaigns/:id/summary', async (req, res) => {
    try {
      const campaignId = req.params.id;
      
      // Get campaign info
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId));
      
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      // Get lead statistics
      const leadsStats = await db
        .select({
          status: campaignLeads.status,
          count: sql<number>`count(*)::int`,
        })
        .from(campaignLeads)
        .where(eq(campaignLeads.campaignId, campaignId))
        .groupBy(campaignLeads.status);
      
      // Calculate totals
      const leads = {
        total: 0,
        pending: 0,
        dialing: 0,
        connected: 0,
        completed: 0,
        failed: 0,
        retry: 0,
        doNotCall: 0,
      };
      
      for (const stat of leadsStats) {
        leads.total += stat.count;
        switch (stat.status) {
          case 'PENDING':
            leads.pending = stat.count;
            break;
          case 'DIALING':
            leads.dialing = stat.count;
            break;
          case 'CONNECTED':
            leads.connected = stat.count;
            break;
          case 'COMPLETED':
            leads.completed = stat.count;
            break;
          case 'FAILED':
            leads.failed = stat.count;
            break;
          case 'RETRY':
            leads.retry = stat.count;
            break;
          case 'DO_NOT_CALL':
            leads.doNotCall = stat.count;
            break;
        }
      }
      
      // Calculate progress
      const progress = leads.total > 0 
        ? Math.round(((leads.completed + leads.failed + leads.doNotCall) / leads.total) * 100)
        : 0;
      
      // Get queue statistics (mock for now since Redis might not be fully connected)
      const queue = {
        waiting: leads.pending,
        active: leads.dialing,
        completed: leads.completed,
        failed: leads.failed,
        delayed: leads.retry,
      };
      
      res.json({
        campaign,
        leads,
        progress,
        queue,
      });
    } catch (error) {
      console.error('Error fetching campaign summary:', error);
      res.status(500).json({ error: 'Failed to fetch campaign summary' });
    }
  });

  // Upload campaign leads
  app.post('/api/campaigns/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { name, pacingMaxConcurrent, interCallMs, timezone } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Campaign name is required' });
      }
      
      // Parse the uploaded file
      let parseResult;
      
      if (req.file.originalname.endsWith('.csv')) {
        const csvContent = req.file.buffer.toString('utf-8');
        parseResult = await parseCSV(csvContent);
      } else {
        parseResult = parseExcel(req.file.buffer);
      }
      
      if (parseResult.validLeads === 0) {
        return res.status(400).json({ 
          error: 'No valid leads found in the uploaded file',
          details: parseResult.errors 
        });
      }
      
      // Create campaign
      const campaignId = nanoid();
      await db.insert(campaigns).values({
        id: campaignId,
        name,
        status: 'DRAFT',
        pacingMaxConcurrent: parseInt(pacingMaxConcurrent) || 2,
        interCallMs: parseInt(interCallMs) || 1500,
        timezone: timezone || 'Asia/Dubai',
        businessHours: {
          start: '09:30',
          end: '19:30',
          days: [0, 1, 2, 3, 4, 5], // Sunday to Friday
        },
        createdAt: new Date(),
      });
      
      // Filter out suppressed leads
      let importedCount = 0;
      let suppressedCount = 0;
      
      for (const lead of parseResult.leads) {
        const suppressed = await isSuppressed(lead.phoneE164);
        
        if (suppressed) {
          suppressedCount++;
          continue;
        }
        
        await db.insert(campaignLeads).values({
          id: nanoid(),
          campaignId,
          fullName: lead.fullName,
          phoneE164: lead.phoneE164,
          email: lead.email,
          notes: lead.notes,
          custom: lead.custom,
          status: 'PENDING',
          attempts: 0,
          updatedAt: new Date(),
        });
        
        importedCount++;
      }
      
      res.json({
        campaignId,
        totalImported: importedCount,
        totalRows: parseResult.totalRows,
        errors: parseResult.errors,
        suppressedCount,
      });
      
    } catch (error) {
      console.error('Error uploading campaign:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to upload campaign' 
      });
    }
  });

  // Get campaign leads with pagination and filtering
  app.get('/api/campaigns/:id/leads', async (req, res) => {
    try {
      const campaignId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      const statusFilter = req.query.statusFilter as string;
      const searchTerm = req.query.searchTerm as string;
      
      let query = db
        .select()
        .from(campaignLeads)
        .where(eq(campaignLeads.campaignId, campaignId));
      
      // Apply filters
      if (statusFilter) {
        query = query.where(and(
          eq(campaignLeads.campaignId, campaignId),
          eq(campaignLeads.status, statusFilter as any)
        ));
      }
      
      if (searchTerm) {
        query = query.where(and(
          eq(campaignLeads.campaignId, campaignId),
          sql`(${campaignLeads.fullName} ILIKE ${`%${searchTerm}%`} OR ${campaignLeads.phoneE164} LIKE ${`%${searchTerm}%`})`
        ));
      }
      
      // Get total count
      const totalQuery = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(campaignLeads)
        .where(eq(campaignLeads.campaignId, campaignId));
      
      const total = totalQuery[0]?.count || 0;
      
      // Get paginated results
      const leadsResult = await query
        .orderBy(desc(campaignLeads.updatedAt))
        .limit(limit)
        .offset(offset);
      
      res.json({
        leads: leadsResult,
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error('Error fetching campaign leads:', error);
      res.status(500).json({ error: 'Failed to fetch campaign leads' });
    }
  });

  // Start campaign
  app.post('/api/campaigns/:id/start', async (req, res) => {
    try {
      const campaignId = req.params.id;
      
      // Update campaign status
      await db
        .update(campaigns)
        .set({ status: 'RUNNING' })
        .where(eq(campaigns.id, campaignId));
      
      // Queue pending leads for calling
      const pendingLeads = await db
        .select()
        .from(campaignLeads)
        .where(and(
          eq(campaignLeads.campaignId, campaignId),
          eq(campaignLeads.status, 'PENDING')
        ))
        .limit(100); // Start with first 100 leads
      
      for (const lead of pendingLeads) {
        try {
          await callQueue.add('make-call', {
            campaignId,
            leadId: lead.id,
            phoneE164: lead.phoneE164,
            attempt: 1,
          }, {
            delay: Math.random() * 5000, // Randomize initial delays
            removeOnComplete: 100,
            removeOnFail: 50,
          });
          
          // Update lead status
          await db
            .update(campaignLeads)
            .set({ 
              status: 'PENDING',
              updatedAt: new Date() 
            })
            .where(eq(campaignLeads.id, lead.id));
            
        } catch (queueError) {
          console.error('Failed to queue lead:', lead.id, queueError);
        }
      }
      
      res.json({ message: 'Campaign started successfully' });
    } catch (error) {
      console.error('Error starting campaign:', error);
      res.status(500).json({ error: 'Failed to start campaign' });
    }
  });

  // Pause campaign
  app.post('/api/campaigns/:id/pause', async (req, res) => {
    try {
      const campaignId = req.params.id;
      
      await db
        .update(campaigns)
        .set({ status: 'PAUSED' })
        .where(eq(campaigns.id, campaignId));
      
      // TODO: Pause queue processing for this campaign
      
      res.json({ message: 'Campaign paused successfully' });
    } catch (error) {
      console.error('Error pausing campaign:', error);
      res.status(500).json({ error: 'Failed to pause campaign' });
    }
  });

  // Resume campaign
  app.post('/api/campaigns/:id/resume', async (req, res) => {
    try {
      const campaignId = req.params.id;
      
      await db
        .update(campaigns)
        .set({ status: 'RUNNING' })
        .where(eq(campaigns.id, campaignId));
      
      res.json({ message: 'Campaign resumed successfully' });
    } catch (error) {
      console.error('Error resuming campaign:', error);
      res.status(500).json({ error: 'Failed to resume campaign' });
    }
  });

  // Stop campaign
  app.post('/api/campaigns/:id/stop', async (req, res) => {
    try {
      const campaignId = req.params.id;
      
      await db
        .update(campaigns)
        .set({ status: 'STOPPED' })
        .where(eq(campaigns.id, campaignId));
      
      // TODO: Clear queue for this campaign
      
      res.json({ message: 'Campaign stopped successfully' });
    } catch (error) {
      console.error('Error stopping campaign:', error);
      res.status(500).json({ error: 'Failed to stop campaign' });
    }
  });

  // Add number to suppression list
  app.post('/api/campaigns/suppression', async (req, res) => {
    try {
      const { phoneE164, reason } = req.body;
      
      if (!phoneE164) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      
      await recordOptOut(phoneE164, reason || 'Manual suppression');
      
      // Update any existing campaign leads
      await db
        .update(campaignLeads)
        .set({ 
          status: 'DO_NOT_CALL',
          updatedAt: new Date() 
        })
        .where(eq(campaignLeads.phoneE164, phoneE164));
      
      res.json({ message: 'Number added to suppression list' });
    } catch (error) {
      console.error('Error adding suppression:', error);
      res.status(500).json({ error: 'Failed to add suppression' });
    }
  });
}