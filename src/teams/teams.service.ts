import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Repository } from 'typeorm';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { TEAMS_PAGINATION_CONFIG } from './teams.constants';
import { UpdateTeamDto } from './dto/update-team.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>
  ) {}

  async create(createTeamDto: CreateTeamDto, user: User) {
    if (user.team) {
      throw new BadRequestException("Cannot create new team if user already belong to one")
    }

    const teamSection = this.teamsRepository.create(createTeamDto);

    return this.teamsRepository.save(teamSection);
  }

  findAll(query?: PaginateQuery) {
    return paginate(query, this.teamsRepository, TEAMS_PAGINATION_CONFIG);
  }

  findOne(id: number) {
    return this.teamsRepository.findOne({
      relations: ["members"],
      where: { id },
    });
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const teamSection = this.teamsRepository.create(
      updateTeamDto as unknown as Team
    );
    teamSection.id = id;

    if (updateTeamDto.members) {
      teamSection.members = updateTeamDto.members.map((id) => ({ id }) as User);
    }

    return this.teamsRepository.save(teamSection);
  }

  remove(id: number) {
    return this.teamsRepository.delete({ id });
  }
}
