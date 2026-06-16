import "dotenv/config";

const requiredEnv = ["JWT_SECRET", "DATABASE_URL"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} environment variable is required`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "[security] JWT_SECRET should be at least 32 characters in production."
  );
}

export default process.env;
