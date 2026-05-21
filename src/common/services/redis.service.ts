import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { createHash } from "crypto";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../modules/redis.constants";

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

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
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.cache.del(key)));
      }
    } while (cursor !== "0");
  }

  static gameHistoryKey(userId: string, page?: number, limit?: number, includeCancelled?: boolean, includeInProgress?: boolean): string {
    return `game:history:${userId}:${page ?? 1}:${limit ?? 10}:${includeCancelled ?? false}:${includeInProgress ?? false}`;
  }

  static gameHistoryPattern(userId: string): string {
    return `game:history:${userId}:*`;
  }

  static gamePublicHistoryPattern(userId: string): string {
    return `game:public-history:${userId}:*`;
  }

  static gamePublicHistoryKey(
    userId: string,
    page?: number,
    limit?: number,
    includeCancelled?: boolean,
    includeInProgress?: boolean,
  ): string {
    return `game:public-history:${userId}:${page ?? 1}:${limit ?? 10}:${includeCancelled ?? false}:${includeInProgress ?? false}`;
  }

  static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
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
