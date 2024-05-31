import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Score } from 'src/scores/entities/score.entity';
import { User } from 'src/users/entities/user.entity';
import { TeamMembersExistsRule } from './validation/team-members-exists.rule';
import { TeamMembersNumberRule } from './validation/team-members-number.rule';
import { UniqueMembersRule } from './validation/unique-members.rule';
import { UsersService } from 'src/users/users.service';
import { TeamsService } from 'src/teams/teams.service';
import { Team } from 'src/teams/entities/team.entity';
import { CreatedByUserRule } from './validation/created-by-user.rule';
import { GameReadyRule } from './validation/game-ready.rule';
import { GameParticipantsNumberRule } from './validation/game-participants-number.rule';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Score, User, Team])],
  controllers: [GamesController],
  providers: [
    GamesService,
    UsersService,
    TeamsService,
    TeamMembersExistsRule,
    TeamMembersNumberRule,
    UniqueMembersRule,
    CreatedByUserRule,
    GameReadyRule,
    GameParticipantsNumberRule,
    JwtService,
    AuthService,
  ],
})
export class GamesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("*");
  }
}
