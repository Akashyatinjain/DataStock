import redisClient, { isRedisReady } from "../config/redis.js";

const KEY_PREFIX = "datastock:";

/**
 * Prefix a cache key with the global namespace
 */
const prefixKey = (key) => `${KEY_PREFIX}${key}`;

/**
 * Retrieve an item from the Redis cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed cached value or null on miss/error/offline
 */
export const getCache = async (key) => {
  try {
    if (!isRedisReady() || !redisClient) return null;
    const raw = await redisClient.get(prefixKey(key));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    // Non-fatal: fail open to database
    return null;
  }
};

/**
 * Store an item in the Redis cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Serializable data
 * @param {number} [ttlSeconds=300] - Expiration in seconds (default 5 minutes)
 * @returns {Promise<boolean>}
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    if (!isRedisReady() || !redisClient || value === undefined) return false;
    const serialized = JSON.stringify(value);
    await redisClient.set(prefixKey(key), serialized, "EX", ttlSeconds);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Delete a specific key from cache
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export const deleteCache = async (key) => {
  try {
    if (!isRedisReady() || !redisClient) return false;
    await redisClient.del(prefixKey(key));
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Safely delete all keys matching a glob pattern using SCAN (non-blocking)
 * @param {string} pattern - Pattern to match, e.g. "files:userId:*"
 * @returns {Promise<number>} - Number of keys deleted
 */
export const deleteCachePattern = async (pattern) => {
  try {
    if (!isRedisReady() || !redisClient) return 0;
    const fullPattern = prefixKey(pattern);
    let cursor = "0";
    let totalDeleted = 0;

    do {
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        "MATCH",
        fullPattern,
        "COUNT",
        100
      );
      cursor = nextCursor;

      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== "0");

    return totalDeleted;
  } catch (err) {
    return 0;
  }
};

/**
 * Invalidate all file-related caches for a user
 * (root files, folder files, all files, trash files, version histories)
 * @param {string} userId
 */
export const invalidateUserFilesCache = async (userId) => {
  if (!userId) return;
  await Promise.allSettled([
    deleteCachePattern(`files:${userId}:*`),
    deleteCachePattern(`user:${userId}:*`),
  ]);
};

/**
 * Invalidate folder list caches for a user
 * @param {string} userId
 */
export const invalidateUserFoldersCache = async (userId) => {
  if (!userId) return;
  await Promise.allSettled([
    deleteCache(`folders:${userId}`),
    deleteCachePattern(`folders:${userId}*`),
    deleteCachePattern(`files:${userId}:*`),
  ]);
};

/**
 * Invalidate storage analytics cache for a user
 * @param {string} userId
 */
export const invalidateUserStorageCache = async (userId) => {
  if (!userId) return;
  await deleteCache(`user:${userId}:storage`);
};

/**
 * Invalidate all cached data for a user
 * @param {string} userId
 */
export const invalidateAllUserData = async (userId) => {
  if (!userId) return;
  await Promise.allSettled([
    invalidateUserFilesCache(userId),
    invalidateUserFoldersCache(userId),
    invalidateUserStorageCache(userId),
  ]);
};
