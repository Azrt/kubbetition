import { CacheModule } from "@nestjs/cache-manager";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createKeyv } from "@keyv/redis";
import Redis from "ioredis";
import { RedisService } from "../services/redis.service";
import { REDIS_CLIENT } from "./redis.constants";

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        stores: [createKeyv(configService.get("REDIS_URI"))],
      }),
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis(configService.get("REDIS_URI")),
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
