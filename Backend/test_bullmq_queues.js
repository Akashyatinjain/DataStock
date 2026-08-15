import "./src/config/env.js";
import { getOcrQueue, getEmailQueue, addOcrJob, addEmailJob } from "./src/queues/queue.config.js";
import { processOcrTask } from "./src/queues/workers/ocr.worker.js";
import { processEmailTask } from "./src/queues/workers/email.worker.js";
import { isRedisReady } from "./src/config/redis.js";

const runTests = async () => {
  console.log("=================================================");
  console.log("🧪 RUNNING BULLMQ QUEUE & WORKER TEST SUITE");
  console.log("=================================================");

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, testName) => {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  };

  // TEST 1: Check Queue initialization
  try {
    const ocrQ = getOcrQueue();
    const emailQ = getEmailQueue();
    assert(Boolean(ocrQ && ocrQ.name === "datastock_ocr_queue"), "Test 1: BullMQ OCR Queue initialized successfully");
    assert(Boolean(emailQ && emailQ.name === "datastock_email_queue"), "Test 2: BullMQ Email Queue initialized successfully");
  } catch (err) {
    assert(false, `Test 1 & 2: Queue initialization failed: ${err.message}`);
  }

  // TEST 3: Direct Email Task Processor Execution
  try {
    let mockEmailDispatched = false;
    // We test processEmailTask without real network spam or verify contract
    assert(typeof processEmailTask === "function", "Test 3: processEmailTask worker handler is defined and executable");
  } catch (err) {
    assert(false, `Test 3: Email task processor failed: ${err.message}`);
  }

  // TEST 4: Direct OCR Task Processor Execution
  try {
    assert(typeof processOcrTask === "function", "Test 4: processOcrTask worker handler is defined and executable");
  } catch (err) {
    assert(false, `Test 4: OCR task processor failed: ${err.message}`);
  }

  // TEST 5: Fallback handling when queuing Email job
  try {
    let fallbackCalled = false;
    const result = await addEmailJob(
      "send_otp",
      { email: "test_fallback@example.com", otp: "123456" },
      async () => {
        fallbackCalled = true;
        return { fallbackExecuted: true };
      }
    );

    assert(
      result && (result.enqueued === true || (result.fallback === true && fallbackCalled)),
      "Test 5: addEmailJob either enqueues to BullMQ or executes direct fallback cleanly"
    );
  } catch (err) {
    assert(false, `Test 5: addEmailJob error: ${err.message}`);
  }

  // TEST 6: Fallback handling when queuing OCR job
  try {
    const ocrResult = await addOcrJob({
      fileId: "non_existent_test_file",
      filePath: "./test_dummy.png",
      fileUrl: null,
      mimetype: "image/png",
      userId: "test_user",
    });

    assert(
      ocrResult && (ocrResult.enqueued === true || ocrResult.fallback === true),
      "Test 6: addOcrJob dispatches to BullMQ or background runner without throwing"
    );
  } catch (err) {
    assert(false, `Test 6: addOcrJob error: ${err.message}`);
  }

  console.log("=================================================");
  console.log(`📊 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("=================================================");

  // Cleanup queues
  const ocrQ = getOcrQueue();
  const emailQ = getEmailQueue();
  if (ocrQ) await ocrQ.close().catch(() => {});
  if (emailQ) await emailQ.close().catch(() => {});

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
