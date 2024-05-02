import { Module } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/games/entities/game.entity';
import { Score } from './entities/score.entity';
import { GamesService } from 'src/games/games.service';
import { TeamSection } from 'src/teamSections/entities/teamSection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Score, TeamSection])],
  controllers: [ScoresController],
  providers: [ScoresService, GamesService],
})
export class ScoresModule {}
