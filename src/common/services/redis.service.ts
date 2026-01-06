import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  async get<T>(key: string): Promise<T | null> {
    return await this.cache.get<T>(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const store = this.cache.store as any;
    if (store.keys) {
      const keys = await store.keys(pattern);
      if (keys?.length) {
        await Promise.all(keys.map((key: string) => this.cache.del(key)));
      }
    }
  }

  // Helper to generate cache keys
  static gameHistoryKey(userId: number, page?: number, limit?: number): string {
    return `game:history:${userId}:${page ?? 1}:${limit ?? 10}`;
  }

  static gameHistoryPattern(userId: number): string {
    return `game:history:${userId}:*`;
  }
}
