import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamSection } from 'src/teamSections/entities/teamSection.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, User, TeamSection])],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
