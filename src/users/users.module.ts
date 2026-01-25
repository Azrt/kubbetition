import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { JwtStrategy } from 'src/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { Team } from 'src/teams/entities/team.entity';
import { TeamsService } from 'src/teams/teams.service';
import { IsCurrentUserRule } from './validators/is-current-user.rule';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { UserExistsRule } from 'src/common/validators/user-exists.rule';
import { FriendRequestExistsRule } from './validators/friend-request-exists.rule';
import { GeolocationService } from 'src/common/services/geolocation.service';
import { FileUploadModule } from 'src/common/modules/file-upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team, FriendRequest]), FileUploadModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    ConfigService,
    JwtStrategy,
    JwtService,
    ConfigService,
    AuthService,
    TeamsService,
    IsCurrentUserRule,
    UserExistsRule,
    FriendRequestExistsRule,
    GeolocationService,
  ],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("*");
  }
}
