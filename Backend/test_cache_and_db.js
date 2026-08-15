import { isRedisReady } from "./src/config/redis.js";
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  invalidateUserFilesCache,
  invalidateUserFoldersCache,
  invalidateUserStorageCache,
} from "./src/services/cache.service.js";
import prisma from "./src/config/db.js";

async function runTests() {
  console.log("=== PHASE 1 VERIFICATION TEST SUITE ===");
  console.log("Redis status:", isRedisReady() ? "CONNECTED ⚡" : "OFFLINE (Database fallback active) 🛡️");

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testFailed++;
    }
  }

  // 1. Fallback / Cache operations test
  console.log("\n[1] Testing Cache get/set/del resilience:");
  const testKey = "test:unit:key1";
  const testData = { id: "123", name: "test file", size: 1024 };

  const setResult = await setCache(testKey, testData, 60);
  const getResult = await getCache(testKey);

  if (isRedisReady()) {
    assert(setResult === true, "setCache returned true when Redis is connected");
    assert(getResult && getResult.name === "test file", "getCache retrieved stored JSON correctly");

    const delResult = await deleteCache(testKey);
    assert(delResult === true, "deleteCache deleted key");

    const afterDel = await getCache(testKey);
    assert(afterDel === null, "getCache returned null after deletion");
  } else {
    assert(getResult === null, "getCache gracefully returned null when Redis is offline (no crash)");
    assert(setResult === false, "setCache safely returned false when Redis is offline (no crash)");
  }

  // 2. Pattern Invalidation test
  console.log("\n[2] Testing pattern invalidations:");
  const testUserId = "user-test-uuid-999";
  await setCache(`files:${testUserId}:folder:root`, [{ id: "f1" }], 60);
  await setCache(`files:${testUserId}:all`, [{ id: "f1" }], 60);
  await setCache(`user:${testUserId}:storage`, { storageUsed: 5000 }, 60);

  await invalidateUserFilesCache(testUserId);

  const rootCheck = await getCache(`files:${testUserId}:folder:root`);
  const allCheck = await getCache(`files:${testUserId}:all`);
  assert(rootCheck === null, "invalidateUserFilesCache cleared root files cache");
  assert(allCheck === null, "invalidateUserFilesCache cleared all files cache");

  // 3. Database query test with new indexes
  console.log("\n[3] Testing database indexing & queries:");
  try {
    const userCount = await prisma.user.count();
    assert(true, `Successfully queried User table (Count: ${userCount})`);

    const fileCount = await prisma.file.count();
    assert(true, `Successfully queried File table (Count: ${fileCount})`);

    const folderCount = await prisma.folder.count();
    assert(true, `Successfully queried Folder table (Count: ${folderCount})`);

    // Verify index-optimized compound query
    const indexedQuery = await prisma.file.findMany({
      where: {
        isTrash: false,
        isArchived: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });
    assert(Array.isArray(indexedQuery), `Compound indexed query executed successfully (Returned ${indexedQuery.length} rows)`);

  } catch (dbErr) {
    console.error("Database test error:", dbErr.message);
    assert(false, `Database query failed: ${dbErr.message}`);
  }

  console.log("\n=== TEST RESULTS ===");
  console.log(`Passed: ${testPassed}, Failed: ${testFailed}`);

  await prisma.$disconnect();
  process.exit(testFailed > 0 ? 1 : 0);
}

runTests();
