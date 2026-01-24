import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { TeamsService } from 'src/teams/teams.service';
import { Team } from 'src/teams/entities/team.entity';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt.guard';
import EmailService from 'src/email/email.service';
import { EmailConfirmationGuard } from './guards/email-confirmation.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtMiddleware } from './middleware/jwt.middleware';
import { GeolocationService } from 'src/common/services/geolocation.service';
import { GamesModule } from 'src/games/games.module';

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
    TypeOrmModule.forFeature([User, Team, FriendRequest]),
    forwardRef(() => GamesModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    TeamsService,
    JwtService,
    EmailService,
    ConfigService,
    GeolocationService,
    ...globalGuards,
  ],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("/me");
  }
}
