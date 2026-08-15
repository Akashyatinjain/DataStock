import { Worker } from "bullmq";
import { sendOTPEmail } from "../../utils/email.util.js";
import { sendContactMailDirect } from "../../modules/contact/contact.service.js";
import { getRedisConnectionOptions } from "../queue.config.js";

/**
 * Core Email worker processing function
 */
export const processEmailTask = async (name, data) => {
  console.log(`✉️ [Email Worker] Processing '${name}' for recipient: ${data.email}`);

  if (name === "send_otp") {
    const { email, otp } = data;
    await sendOTPEmail(email, otp);
    console.log(`✅ [Email Worker] OTP email dispatched successfully to ${email}`);
    return { success: true, email };
  } else if (name === "send_contact") {
    const { name: contactName, email, subject, message } = data;
    await sendContactMailDirect({ name: contactName, email, subject, message });
    console.log(`✅ [Email Worker] Contact form email dispatched successfully from ${email}`);
    return { success: true, email };
  } else {
    throw new Error(`Unknown email job type: ${name}`);
  }
};

let emailWorker = null;

export const initEmailWorker = () => {
  if (emailWorker) return emailWorker;

  try {
    emailWorker = new Worker(
      "datastock_email_queue",
      async (job) => {
        return await processEmailTask(job.name, job.data);
      },
      {
        connection: getRedisConnectionOptions(),
        concurrency: 5,
      }
    );

    emailWorker.on("completed", (job) => {
      console.log(`✨ [Email Worker] Job #${job.id} (${job.name}) completed successfully`);
    });

    emailWorker.on("failed", (job, err) => {
      console.warn(`⚠️ [Email Worker] Job #${job?.id} (${job?.name}) failed (attempt ${job?.attemptsMade}): ${err.message}`);
    });

    emailWorker.on("error", (err) => {
      console.warn("⚠️ BullMQ Email Worker notice:", err.message);
    });

    console.log("👷 [Workers] BullMQ Email Worker initialized and listening");
  } catch (err) {
    console.warn("⚠️ Could not start BullMQ Email Worker:", err.message);
    emailWorker = null;
  }

  return emailWorker;
};

export const closeEmailWorker = async () => {
  if (emailWorker) {
    try {
      await emailWorker.close();
    } catch (err) {
      // Ignored
    }
    emailWorker = null;
  }
};
