import { Module } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/games/entities/game.entity';
import { Score } from './entities/score.entity';
import { GamesService } from 'src/games/games.service';
import { TeamSection } from 'src/teamSections/entities/teamSection.entity';
import { TeamSectionsService } from 'src/teamSections/teamSections.service';
import { TeamSectionMembers } from 'src/teamSections/entities/teamSectionMembers.entity';
import { GameInProgressRule } from './validation/game-in-progress.rule';
import { GameReadyRule } from './validation/game-ready.rule';
import { GameUserRule } from './validation/game-user.rule';
import { ScoreReadyListener } from './listeners/score-ready.listener';
import { ScoreUpdateListener } from './listeners/score-update.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, Score, TeamSection, TeamSectionMembers]),
  ],
  controllers: [ScoresController],
  providers: [
    ScoresService,
    GamesService,
    TeamSectionsService,
    GameInProgressRule,
    GameReadyRule,
    GameUserRule,
    ScoreReadyListener,
    ScoreUpdateListener,
  ],
})
export class ScoresModule {}
