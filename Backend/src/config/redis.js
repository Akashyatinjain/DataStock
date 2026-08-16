import Redis from "ioredis";

let redisClient = null;
let isConnected = false;
let lastLogTime = 0;
const LOG_COOLDOWN_MS = 60000; // Throttle repetitive disconnection warnings to once per minute

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
      return Math.min(times * 2000, 30000);
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

  redisClient.on("ready", () => {
    if (!isConnected) {
      isConnected = true;
      console.log("⚡ Redis Cache connected and ready");
    }
  });

  redisClient.on("error", (err) => {
    const wasConnected = isConnected;
    isConnected = false;
    const now = Date.now();
    if (wasConnected || now - lastLogTime > LOG_COOLDOWN_MS) {
      lastLogTime = now;
      console.warn("⚠️ Redis unreachable. Operating in direct database mode (cache disabled).");
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
    const now = Date.now();
    if (now - lastLogTime > LOG_COOLDOWN_MS) {
      lastLogTime = now;
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
