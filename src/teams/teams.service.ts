import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Repository } from 'typeorm';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { TEAMS_PAGINATION_CONFIG } from './teams.constants';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>
  ) {}

  create(createTeamDto: CreateTeamDto) {
    return this.teamsRepository.save(createTeamDto);
  }

  findAll(query?: PaginateQuery) {
    return paginate(query, this.teamsRepository, TEAMS_PAGINATION_CONFIG);
  }

  findOne(id: number) {
    return this.teamsRepository.findOneBy({ id });
  }

  update(id: number, updateTeamDto: UpdateTeamDto) {
    return this.teamsRepository.update({ id }, updateTeamDto);
  }

  remove(id: number) {
    return this.teamsRepository.delete({ id });
  }
}
