import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TeamSection } from "./entities/teamSection.entity";
import { CreateTeamSectionDto } from "./dto/create-team-section.dto";
import { GameType } from "src/common/enums/gameType";
import { UsersService } from "src/users/users.service";
import { TeamsService } from "src/teams/teams.service";
import { PaginateQuery, paginate } from "nestjs-paginate";
import { TEAM_SECTIONS_PAGINATION_CONFIG } from "./teamSections.constants";

@Injectable()
export class TeamSectionsService {
  constructor(
    @InjectRepository(TeamSection)
    private teamSectionsRepository: Repository<TeamSection>,
    private usersService: UsersService,
    private teamsService: TeamsService
  ) {}

  async create(createTeamSectionDto: CreateTeamSectionDto) {
    const members = await this.usersService.findByIds(
      createTeamSectionDto.members
    );
    const team = await this.teamsService.findOne(createTeamSectionDto.team);

    const updatedCreateTeamSectionDto = {
      ...createTeamSectionDto,
      members,
      team,
    };

    return this.teamSectionsRepository.save(updatedCreateTeamSectionDto);
  }

  findAll(query?: PaginateQuery) {
    return paginate(query, this.teamSectionsRepository, TEAM_SECTIONS_PAGINATION_CONFIG);
  }

  findOne(id: number) {
    return this.teamSectionsRepository.findOneBy({ id });
  }

  findAllByTeam(id: number) {
    return this.teamSectionsRepository.findBy({ team: { id } });
  }

  findAllByGameType(type: GameType) {
    return this.teamSectionsRepository.findBy({ type });
  }

  findByMembers(members: Array<number>) {
    return this.teamSectionsRepository
      .createQueryBuilder("section")
      .leftJoin("section.members", "member")
      .where("member.id IN (:...members)", { members })
      .getOne();
  }
}
