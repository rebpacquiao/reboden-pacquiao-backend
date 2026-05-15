import redis from "../lib/redis";

// Cache TTLs in seconds
const TTL = {
  GAS_PRICE: 15, // gas prices change frequently
  BLOCK_NUMBER: 12, // ~Ethereum block time
} as const;

async function get<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null; // Redis unavailable — proceed without cache
  }
}

async function set(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // Redis unavailable — skip silently
  }
}

export const cacheService = { get, set, TTL };
