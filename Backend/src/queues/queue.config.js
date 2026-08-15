import { Queue } from "bullmq";
import Redis from "ioredis";

const getRedisConnectionOptions = () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 1000, 15000),
    });
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  };
};

let ocrQueue = null;
let emailQueue = null;

export const getOcrQueue = () => {
  if (!ocrQueue) {
    try {
      ocrQueue = new Queue("datastock_ocr_queue", {
        connection: getRedisConnectionOptions(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });

      ocrQueue.on("error", (err) => {
        console.warn("⚠️ BullMQ OCR Queue notice:", err.message);
      });
    } catch (err) {
      console.warn("⚠️ Failed to initialize OCR Queue:", err.message);
      ocrQueue = null;
    }
  }
  return ocrQueue;
};

export const getEmailQueue = () => {
  if (!emailQueue) {
    try {
      emailQueue = new Queue("datastock_email_queue", {
        connection: getRedisConnectionOptions(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });

      emailQueue.on("error", (err) => {
        console.warn("⚠️ BullMQ Email Queue notice:", err.message);
      });
    } catch (err) {
      console.warn("⚠️ Failed to initialize Email Queue:", err.message);
      emailQueue = null;
    }
  }
  return emailQueue;
};

/**
 * Dispatches an OCR background job with automatic fail-safe fallback
 * @param {Object} jobData - { fileId, filePath, fileUrl, mimetype, userId }
 */
export const addOcrJob = async (jobData) => {
  try {
    const queue = getOcrQueue();
    if (queue) {
      const job = await queue.add("process_ocr", jobData);
      console.log(`🚀 [Queue] OCR job enqueued: Job ID #${job.id} for File ID ${jobData.fileId}`);
      return { enqueued: true, jobId: job.id };
    }
  } catch (err) {
    console.warn("⚠️ [Queue] Failed to enqueue OCR job to BullMQ:", err.message);
  }

  // Fallback: Run OCR extraction in background without blocking caller
  setImmediate(async () => {
    try {
      const { processOcrTask } = await import("./workers/ocr.worker.js");
      await processOcrTask(jobData);
    } catch (fallbackErr) {
      console.error("⚠️ [Fallback] Background OCR task error:", fallbackErr.message);
    }
  });

  return { enqueued: false, fallback: true };
};

/**
 * Dispatches an Email background job with automatic fail-safe fallback
 * @param {string} jobName - 'send_otp' | 'send_contact'
 * @param {Object} jobData - email payload
 * @param {Function} fallbackFn - synchronous function to call if queue is unavailable
 */
export const addEmailJob = async (jobName, jobData, fallbackFn) => {
  try {
    const queue = getEmailQueue();
    if (queue) {
      const job = await queue.add(jobName, jobData);
      console.log(`🚀 [Queue] Email job enqueued: ${jobName} for ${jobData.email || "recipient"} (Job ID #${job.id})`);
      return { enqueued: true, jobId: job.id };
    }
  } catch (err) {
    console.warn("⚠️ [Queue] Failed to enqueue Email job to BullMQ, triggering instant fallback:", err.message);
  }

  // Direct Fallback execution so no OTP or message is ever missed
  if (typeof fallbackFn === "function") {
    try {
      console.log("⚡ [Email Fallback] Executing direct email send...");
      const result = await fallbackFn();
      return { enqueued: false, fallback: true, result };
    } catch (fallbackErr) {
      console.error("⚠️ [Email Fallback] Direct email send failed:", fallbackErr.message);
      throw fallbackErr;
    }
  }

  return { enqueued: false, fallback: false };
};

export { getRedisConnectionOptions };
