import Redis from "ioredis";

let redisClient = null;
let isConnected = false;
let hasLoggedFailure = false;

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

try {
  const options = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    autoResubscribe: true,
    autoResendUnfulfilledCommands: false,
    retryStrategy: (times) => {
      // Reconnect with capped backoff; stop spamming logs after repeated failures
      if (times > 5 && !hasLoggedFailure) {
        hasLoggedFailure = true;
        console.warn("⚠️ Redis unreachable. Operating in direct database mode (cache disabled).");
      }
      return Math.min(times * 1500, 30000);
    },
  };

  if (redisUrl) {
    redisClient = new Redis(redisUrl, options);
  } else {
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      ...options,
    });
  }

  redisClient.on("connect", () => {
    isConnected = true;
    hasLoggedFailure = false;
    console.log("⚡ Redis Cache connected successfully");
  });

  redisClient.on("ready", () => {
    isConnected = true;
  });

  redisClient.on("error", (err) => {
    isConnected = false;
    if (!hasLoggedFailure) {
      hasLoggedFailure = true;
      console.warn("⚠️ Redis Cache notice (continuing without cache):", err.message);
    }
  });

  redisClient.on("close", () => {
    isConnected = false;
  });

  redisClient.on("reconnecting", () => {
    // silently reconnecting in background
  });

  // Attempt initial connect asynchronously without blocking server boot
  redisClient.connect().catch((err) => {
    isConnected = false;
    if (!hasLoggedFailure) {
      hasLoggedFailure = true;
      console.warn("⚠️ Redis not available at startup. Operating in direct database fallback mode.");
    }
  });
} catch (err) {
  console.warn("⚠️ Redis initialization notice:", err.message);
  redisClient = null;
  isConnected = false;
}

/**
 * Returns true if Redis is online and ready to accept commands
 */
export const isRedisReady = () => {
  return Boolean(redisClient && isConnected && redisClient.status === "ready");
};

export default redisClient;
