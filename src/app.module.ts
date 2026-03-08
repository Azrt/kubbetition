import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import { DataSource } from 'typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { MulterModule } from '@nestjs/platform-express';
import { TeamsModule } from './teams/teams.module';
import { DatabaseModule } from './common/modules/database.module';
import { GamesModule } from './games/games.module';
import { EmailModule } from './email/email.module';
import { TeamRequestsModule } from './team-requests/team-requests.module';
import { JwtModule } from '@nestjs/jwt';
import { configValidationSchema } from './app.config-schema';
import { FirebaseModule } from './common/modules/firebase.module';
import { RedisModule } from './common/modules/redis.module';
import { CountriesModule } from './countries/countries.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    MulterModule.register({
      dest: "./uploads",
      preservePath: true,
    }),
    ConfigModule.forRoot({
      envFilePath: [".local.env", ".env"],
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: "short",
            ttl: config.get("THROTTLE_SHORT_TTL_MS", 1000),
            limit: config.get("THROTTLE_SHORT_LIMIT", 20),
          },
          {
            name: "medium",
            ttl: config.get("THROTTLE_MEDIUM_TTL_MS", 10_000),
            limit: config.get("THROTTLE_MEDIUM_LIMIT", 100),
          },
          {
            name: "long",
            ttl: config.get("THROTTLE_LONG_TTL_MS", 60_000),
            limit: config.get("THROTTLE_LONG_LIMIT", 300),
          },
        ],
        skipIf: (context) => {
          const request = context.switchToHttp().getRequest();
          const path = request?.url?.split("?")[0] ?? "";
          return path === "/swagger" || path.startsWith("/swagger/") || path === "/swagger-json";
        },
      }),
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      verboseMemoryLeak: process.env.NODE_ENV !== "production",
    }),
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== "production",
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: `${configService.get("JWT_EXPIRATION_TIME")}s`,
        },
      }),
    }),
    DatabaseModule,
    FirebaseModule,
    RedisModule,
    AuthModule,
    EmailModule,
    UsersModule,
    TeamsModule,
    GamesModule,
    TeamRequestsModule,
    CountriesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    GoogleStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
