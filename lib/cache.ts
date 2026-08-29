// Simple in-memory server-side cache with TTL.
// NOTE: This resets on server restart / cold start (fine for assignment scope).
// For production/multi-instance deployments, swap this for Redis.

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type CacheStatusEntry = {
  key: string;
  status: "HIT" | "MISS" | "EXPIRED";
  cachedAt?: number;
  expiresAt?: number;
};

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private lastAccess = new Map<string, "HIT" | "MISS">();

  private ttlMs(): number {
    const seconds = Number(process.env.CACHE_TTL_SECONDS ?? 300);
    return seconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.lastAccess.set(key, "MISS");
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.lastAccess.set(key, "MISS");
      return null;
    }
    this.lastAccess.set(key, "HIT");
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs(),
    });
  }

  status(): CacheStatusEntry[] {
    const now = Date.now();
    return Array.from(this.store.entries()).map(([key, entry]) => ({
      key,
      status:
        this.lastAccess.get(key) === "HIT" && now <= entry.expiresAt
          ? "HIT"
          : now > entry.expiresAt
          ? "EXPIRED"
          : "MISS",
      cachedAt: entry.expiresAt - this.ttlMs(),
      expiresAt: entry.expiresAt,
    })) as CacheStatusEntry[];
  }

  clear(): void {
    this.store.clear();
    this.lastAccess.clear();
  }
}

// Use a global singleton so Next.js hot-reload / route re-invocation
// in dev doesn't wipe the cache on every request.
const globalForCache = globalThis as unknown as { __weatherCache?: MemoryCache };

export const weatherCache = globalForCache.__weatherCache ?? new MemoryCache();
globalForCache.__weatherCache = weatherCache;
