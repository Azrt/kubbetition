import { Module } from '@nestjs/common';
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

@Module({
  imports: [TypeOrmModule.forFeature([Game, Score, User])],
  controllers: [ScoresController],
  providers: [
    ScoresService,
    GamesService,
    GameInProgressRule,
    GameScoreReadyRule,
    GameUserRule,
    GameNotCancelledRule,
    ScoreReadyListener,
    ScoreUpdateListener,
  ],
})
export class ScoresModule {}
