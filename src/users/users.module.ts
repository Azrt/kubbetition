import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtStrategy } from 'src/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { Team } from 'src/teams/entities/team.entity';
import { TeamsService } from 'src/teams/teams.service';
import { TeamSection } from 'src/teamSections/entities/teamSection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team, TeamSection])],
  controllers: [UsersController],
  providers: [UsersService, ConfigService, JwtStrategy, TeamsService],
})
export class UsersModule {}
