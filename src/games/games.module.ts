import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersExistRule } from './validation/users-exist.rule';
import { ParticipantsAreFriendsOrTeamMembersRule } from './validation/participants-are-friends-or-team-members.rule';
import { UsersService } from 'src/users/users.service';
import { TeamsService } from 'src/teams/teams.service';
import { Team } from 'src/teams/entities/team.entity';
import { CreatedByUserRule } from './validation/created-by-user.rule';
import { GameReadyRule } from './validation/game-ready.rule';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { GamesGateway } from './games.gateway';
import { FirebaseModule } from 'src/common/modules/firebase.module';
import { RedisService } from 'src/common/services/redis.service';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { GeolocationService } from 'src/common/services/geolocation.service';
import { FileUploadModule } from 'src/common/modules/file-upload.module';

@Module({
  imports: [
    FirebaseModule,
    TypeOrmModule.forFeature([Game, User, Team, FriendRequest]),
    forwardRef(() => AuthModule),
    FileUploadModule,
  ],
  controllers: [GamesController],
  providers: [
    GamesService,
    UsersService,
    TeamsService,
    UsersExistRule,
    ParticipantsAreFriendsOrTeamMembersRule,
    CreatedByUserRule,
    GameReadyRule,
    JwtService,
    GamesGateway,
    RedisService,
    GeolocationService,
  ],
  exports: [GamesService],
})
export class GamesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("*");
  }
}
