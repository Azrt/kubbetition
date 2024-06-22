import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import { DataSource } from 'typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import * as Joi from '@hapi/joi';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TeamsModule } from './teams/teams.module';
import { DatabaseModule } from './common/modules/database.module';
import { GamesModule } from './games/games.module';
import { ScoresModule } from './scores/scores.module';
import { EmailModule } from './email/email.module';
import { TeamRequestsModule } from './team-requests/team-requests.module';
import { JwtMiddleware } from './auth/middleware/jwt.middleware';
import { JwtModule } from '@nestjs/jwt';

const configValidationSchema = Joi.object({
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.number().required(),
  JWT_EMAIL_EXPIRATION_TIME: Joi.number().required(),
  EMAIL_SERVICE: Joi.string().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_CONFIRMATION_URL: Joi.string().required(),
  EMAIL_PORT: Joi.string().required(),
  EMAIL_HOST: Joi.string().required(),
  REDIS_PASS: Joi.string().required(),
  REDIS_URI: Joi.string().required(),
  RABBITMQ_DEFAULT_USER: Joi.string().required(),
  RABBITMQ_DEFAULT_PASS: Joi.string().required(),
  RABBITMQ_USER: Joi.string().required(),
  RABBITMQ_PASS: Joi.string().required(),
});

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
    }),
    MulterModule.register({
      dest: "./uploads",
      preservePath: true,
    }),
    ConfigModule.forRoot({
      envFilePath: [".local.env", ".env"],
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
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
    AuthModule,
    EmailModule,
    UsersModule,
    TeamsModule,
    ScoresModule,
    GamesModule,
    TeamRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService, GoogleStrategy],
  exports: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
