// Temporarily disabled - BullMQ requires Redis
// import { Worker, Job } from 'bullmq';
// import Redis from 'ioredis';
import { db } from '../db';
import { campaigns, campaignLeads, campaignCallLogs } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isBusinessHours, getNextBusinessWindow, isSuppressed, recordOptOut } from '../services/compliance';
import { makeCall, getCallStatus } from '../services/telephony';
import { renderAgentUtterance } from '../services/llm';
import { toSSML } from '../services/ssml';
import { ttsService } from '../services/tts';
import { CallJobData } from '../queues/calls.queue';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
});

export const callWorker = new Worker<CallJobData>(
  'bayti-auto-dial',
  async (job: Job<CallJobData>) => {
    const { campaignId, leadId, phoneE164, attempt } = job.data;
    
    console.log(`Processing call job: ${job.id} for lead ${leadId} (attempt ${attempt + 1})`);
    
    try {
      // Fetch campaign and lead data
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);
        
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      
      // Check if campaign is still running
      if (campaign.status !== 'RUNNING') {
        console.log(`Campaign ${campaignId} is not running (status: ${campaign.status})`);
        return { skipped: true, reason: 'Campaign not running' };
      }
      
      const [lead] = await db
        .select()
        .from(campaignLeads)
        .where(eq(campaignLeads.id, leadId))
        .limit(1);
        
      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }
      
      // Check if lead should be called
      if (lead.status === 'DO_NOT_CALL' || lead.status === 'COMPLETED') {
        console.log(`Lead ${leadId} has status ${lead.status}, skipping`);
        return { skipped: true, reason: `Lead status: ${lead.status}` };
      }
      
      // Check suppression list
      if (await isSuppressed(phoneE164)) {
        console.log(`Phone ${phoneE164} is suppressed, updating lead status`);
        await db
          .update(campaignLeads)
          .set({ 
            status: 'DO_NOT_CALL',
            lastError: 'Phone number is on suppression list',
            updatedAt: new Date()
          })
          .where(eq(campaignLeads.id, leadId));
        return { skipped: true, reason: 'Phone suppressed' };
      }
      
      // Check business hours
      const businessHours = campaign.businessHours as { start: string; end: string; days: number[] };
      if (!await isBusinessHours(campaign.timezone, businessHours)) {
        console.log(`Outside business hours for campaign ${campaignId}`);
        
        // Reschedule for next business window
        const nextWindow = await getNextBusinessWindow(campaign.timezone, businessHours);
        const delayMs = nextWindow.getTime() - Date.now();
        
        // Re-add job with delay
        await job.moveToDelayed(delayMs);
        return { rescheduled: true, nextCall: nextWindow };
      }
      
      // Update lead status to DIALING
      await db
        .update(campaignLeads)
        .set({ 
          status: 'DIALING',
          attempts: attempt + 1,
          updatedAt: new Date()
        })
        .where(eq(campaignLeads.id, leadId));
      
      // Make the call
      const callSid = await makeCall({
        to: phoneE164,
        campaignId,
        leadId,
        timeout: 30,
        machineDetection: true
      });
      
      if (!callSid) {
        throw new Error('Failed to initiate call');
      }
      
      // Update lead with call SID
      await db
        .update(campaignLeads)
        .set({ 
          lastCallSid: callSid,
          updatedAt: new Date()
        })
        .where(eq(campaignLeads.id, leadId));
      
      // Create call log entry
      await db
        .insert(campaignCallLogs)
        .values({
          leadId,
          callSid,
          status: 'initiated',
          metadata: { 
            campaignId,
            attempt: attempt + 1,
            worker: 'auto-dial'
          }
        });
      
      console.log(`Call initiated successfully: ${callSid}`);
      
      // Wait for inter-call delay (campaign pacing)
      if (campaign.interCallMs > 0) {
        await new Promise(resolve => setTimeout(resolve, campaign.interCallMs));
      }
      
      return { 
        success: true, 
        callSid,
        phoneE164,
        attempt: attempt + 1
      };
      
    } catch (error) {
      console.error(`Call job failed for lead ${leadId}:`, error);
      
      // Update lead with error
      await db
        .update(campaignLeads)
        .set({
          status: attempt >= 2 ? 'FAILED' : 'RETRY',
          lastError: error instanceof Error ? error.message : 'Unknown error',
          attempts: attempt + 1,
          updatedAt: new Date()
        })
        .where(eq(campaignLeads.id, leadId));
      
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: parseInt(process.env.MAX_CONCURRENT_CALLS || '3'),
  }
);

// Handle completed jobs
callWorker.on('completed', async (job) => {
  console.log(`Call job completed: ${job.id}`, job.returnvalue);
});

// Handle failed jobs
callWorker.on('failed', async (job, err) => {
  console.error(`Call job failed: ${job?.id}`, err.message);
  
  if (job && job.data) {
    const { leadId, attempt } = job.data;
    
    // If this was the final attempt, mark as failed
    if (attempt >= 2) {
      await db
        .update(campaignLeads)
        .set({
          status: 'FAILED',
          lastError: err.message,
          updatedAt: new Date()
        })
        .where(eq(campaignLeads.id, leadId));
    }
  }
});

// Handle stalled jobs (jobs that have been processing for too long)
callWorker.on('stalled', async (jobId) => {
  console.warn(`Call job stalled: ${jobId}`);
});

console.log('Call worker started with concurrency:', parseInt(process.env.MAX_CONCURRENT_CALLS || '3'));