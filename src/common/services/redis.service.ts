import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';

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

  static gameHistoryKey(userId: string, page?: number, limit?: number, includeCancelled?: boolean, includeInProgress?: boolean): string {
    return `game:history:${userId}:${page ?? 1}:${limit ?? 10}:${includeCancelled ?? false}:${includeInProgress ?? false}`;
  }

  static gameHistoryPattern(userId: string): string {
    return `game:history:${userId}:*`;
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  static refreshTokenKey(userId: string, tokenHash: string): string {
    return `refresh_token:${userId}:${tokenHash}`;
  }

  static refreshTokenPattern(userId: string): string {
    return `refresh_token:${userId}:*`;
  }

  async storeRefreshToken(userId: string, token: string, ttlMs: number): Promise<void> {
    const hash = RedisService.hashToken(token);
    const key = RedisService.refreshTokenKey(userId, hash);
    await this.set(key, userId, ttlMs);
  }

  async verifyRefreshToken(userId: string, token: string): Promise<boolean> {
    const hash = RedisService.hashToken(token);
    const key = RedisService.refreshTokenKey(userId, hash);
    const stored = await this.get<string>(key);
    return stored !== null && stored !== undefined;
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    const hash = RedisService.hashToken(token);
    const key = RedisService.refreshTokenKey(userId, hash);
    await this.del(key);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const pattern = RedisService.refreshTokenPattern(userId);
    await this.delByPattern(pattern);
  }
}
