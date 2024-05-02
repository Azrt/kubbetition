import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { TeamSectionsService } from 'src/teamSections/teamSections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamSection } from 'src/teamSections/entities/teamSection.entity';
import { Game } from './entities/game.entity';
import { TeamSectionMembers } from 'src/teamSections/entities/teamSectionMembers.entity';
import { Score } from 'src/scores/entities/score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamSection, Game, TeamSectionMembers, Score]),
  ],
  controllers: [GamesController],
  providers: [GamesService, TeamSectionsService],
})
export class GamesModule {}
