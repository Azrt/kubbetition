import { Module } from '@nestjs/common';
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
  ],
})
export class GamesModule {}
