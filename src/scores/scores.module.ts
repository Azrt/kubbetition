import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/games/entities/game.entity';
import { Score } from './entities/score.entity';
import { GamesService } from 'src/games/games.service';
import { GameInProgressRule } from './validation/game-in-progress.rule';
import { GameScoreReadyRule } from "./validation/game-score-ready.rule";
import { GameUserRule } from './validation/game-user.rule';
import { ScoreReadyListener } from './listeners/score-ready.listener';
import { ScoreUpdateListener } from './listeners/score-update.listener';
import { User } from 'src/users/entities/user.entity';
import { GameNotCancelledRule } from './validation/game-is-not-cancelled.rule';
import { GameMembersNumberRule } from './validation/game-members-number.rule';
import { CanJoinGameRule } from './validation/can-join-game.rule';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { TeamsService } from 'src/teams/teams.service';
import { Team } from 'src/teams/entities/team.entity';
import { ScoreExistsRule } from './validation/score-exists.rule';
import { GamesGateway } from 'src/games/games.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Score, User, Team])],
  controllers: [ScoresController],
  providers: [
    ScoresService,
    GamesService,
    GameInProgressRule,
    GameScoreReadyRule,
    GameUserRule,
    GameNotCancelledRule,
    GameMembersNumberRule,
    ScoreReadyListener,
    ScoreUpdateListener,
    CanJoinGameRule,
    AuthService,
    JwtService,
    UsersService,
    TeamsService,
    ScoreExistsRule,
    // GamesGateway,
  ],
})
export class ScoresModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("*");
  }
}
