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

import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
    FirebaseModule,
    RedisModule,
    AuthModule,
    EmailModule,
    UsersModule,
    TeamsModule,
    GamesModule,
    TeamRequestsModule,
    CountriesModule,
  ],
  controllers: [AppController],
  providers: [AppService, GoogleStrategy],
  exports: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
