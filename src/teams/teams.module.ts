import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { CountryExistsRule } from 'src/common/validators/country-exists.rule';
import { CountriesService } from 'src/countries/countries.service';
import { SameTeamGuard } from 'src/common/guards/same-team.guard';
import { FileUploadModule } from 'src/common/modules/file-upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Team, User]), FileUploadModule],
  controllers: [TeamsController],
  providers: [TeamsService, CountriesService, CountryExistsRule, SameTeamGuard],
})
export class TeamsModule {}
