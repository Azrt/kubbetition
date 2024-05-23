import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import { DataSource } from 'typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import * as Joi from '@hapi/joi';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
// import { memoryStorage } from 'multer';
import { TeamsModule } from './teams/teams.module';
import { DatabaseModule } from './database.module';
import { TeamSectionsModule } from './teamSections/teamSections.module';
import { GamesModule } from './games/games.module';
import { ScoresModule } from './scores/scores.module';
import { EmailModule } from './email/email.module';
import { TeamRequestsModule } from './teamRequests/teamRequests.module';

const configValidationSchema = Joi.object({
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  // PORT: Joi.number(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.number().required(),
  JWT_EMAIL_EXPIRATION_TIME: Joi.number().required(),
  EMAIL_SERVICE: Joi.string().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_CONFIRMATION_URL: Joi.string().required(),
  EMAIL_PORT: Joi.string().required(),
  EMAIL_HOST: Joi.string().required(),
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
    DatabaseModule,
    AuthModule,
    EmailModule,
    UsersModule,
    TeamsModule,
    TeamSectionsModule,
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
