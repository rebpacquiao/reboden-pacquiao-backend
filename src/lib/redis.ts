import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 5000,
});

redis.on("error", (err: Error) =>
  console.warn("[Redis] Unavailable — caching disabled:", err.message),
);

export default redis;
