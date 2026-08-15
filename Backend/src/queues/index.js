import { getOcrQueue, getEmailQueue, addOcrJob, addEmailJob } from "./queue.config.js";
import { initOcrWorker, closeOcrWorker } from "./workers/ocr.worker.js";
import { initEmailWorker, closeEmailWorker } from "./workers/email.worker.js";

/**
 * Initializes BullMQ background queues and worker consumers
 */
export const initQueuesAndWorkers = () => {
  console.log("🚀 [Queues] Initializing BullMQ Background Queues & Workers...");

  // Pre-initialize Queues
  getOcrQueue();
  getEmailQueue();

  // Start background Workers
  initOcrWorker();
  initEmailWorker();
};

/**
 * Gracefully closes queues and workers on shutdown
 */
export const closeQueuesAndWorkers = async () => {
  console.log("🛑 [Queues] Closing BullMQ Background Queues & Workers...");
  await Promise.all([
    closeOcrWorker(),
    closeEmailWorker(),
  ]);
};

export {
  addOcrJob,
  addEmailJob,
  getOcrQueue,
  getEmailQueue,
};
