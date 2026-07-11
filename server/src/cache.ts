/**
 * Optional Redis cache for session hot-paths.
 * Falls back to a Map when REDIS_URL is unset (demo / single-node).
 */
import { Redis as RedisClient } from "ioredis";

type Cache = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
};

class MemoryCache implements Cache {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string) {
    const row = this.store.get(key);
    if (!row) return null;
    if (row.expiresAt && Date.now() > row.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return row.value;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string) {
    this.store.delete(key);
  }
}

class RedisCache implements Cache {
  constructor(private client: RedisClient) {}

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) await this.client.set(key, value, "EX", ttlSeconds);
    else await this.client.set(key, value);
  }

  async del(key: string) {
    await this.client.del(key);
  }
}

export function createCache(): Cache {
  const url = process.env.REDIS_URL;
  if (!url) return new MemoryCache();
  const client = new RedisClient(url, { maxRetriesPerRequest: 1, lazyConnect: true });
  client.connect().catch(() => {
    console.warn("[cache] Redis connect failed — using memory fallback for subsequent ops");
  });
  return new RedisCache(client);
}

export const cache = createCache();
