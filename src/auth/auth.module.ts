import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TeamsService } from 'src/teams/teams.service';
import { Team } from 'src/teams/entities/team.entity';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt.guard';
import { EmailConfirmationService } from 'src/email/emailConfirmation.service';
import EmailService from 'src/email/email.service';
import { EmailConfirmationGuard } from './guards/email-confirmation.guard';
import { RolesGuard } from './guards/roles.guard';

const globalGuards = [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: EmailConfirmationGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
];

@Module({
  imports: [
    ConfigModule,
    PassportModule,
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
    TypeOrmModule.forFeature([User, Team]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    TeamsService,
    JwtService,
    EmailService,
    EmailConfirmationService,
    ...globalGuards,
  ],
})
export class AuthModule {}
