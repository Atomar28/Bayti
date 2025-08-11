// Temporarily disabled - BullMQ requires Redis
// import { Queue } from 'bullmq';
// import Redis from 'ioredis';

// Temporarily disabled - BullMQ requires Redis
/*
// Redis connection with proper configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
});
*/

export interface CallJobData {
  campaignId: string;
  leadId: string;
  phoneE164: string;
  attempt: number;
}

// Temporarily disabled - BullMQ requires Redis
/*
// Create the auto-dial queue
export const callQueue = new Queue<CallJobData>('bayti-auto-dial', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
*/

export async function addCallJob(data: CallJobData, delay: number = 0): Promise<void> {
  // Temporarily disabled - BullMQ requires Redis
  console.log('Call job would be queued:', data, 'delay:', delay);
  // await callQueue.add(
  //   `call-${data.leadId}`,
  //   data,
  //   {
  //     delay,
  //     jobId: `call-${data.leadId}-${Date.now()}`, // Unique ID to prevent duplicates
  //   }
  // );
}

export async function addBulkCallJobs(jobs: CallJobData[], batchSize: number = 50): Promise<void> {
  const jobData = jobs.map((data, index) => ({
    name: `call-${data.leadId}`,
    data,
    opts: {
      delay: index * (data.attempt > 0 ? 5000 : 1500), // Stagger calls
      jobId: `call-${data.leadId}-${Date.now()}-${index}`,
    },
  }));

  // Add jobs in batches to avoid overwhelming Redis
  for (let i = 0; i < jobData.length; i += batchSize) {
    const batch = jobData.slice(i, i + batchSize);
    await callQueue.addBulk(batch);
  }
}

export async function pauseQueue(): Promise<void> {
  await callQueue.pause();
}

export async function resumeQueue(): Promise<void> {
  await callQueue.resume();
}

export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    callQueue.getWaiting(),
    callQueue.getActive(),
    callQueue.getCompleted(),
    callQueue.getFailed(),
    callQueue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}

export async function clearQueue(): Promise<void> {
  await callQueue.obliterate({ force: true });
}