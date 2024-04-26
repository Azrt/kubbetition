import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { TeamSection } from "./entities/teamSection.entity";
import { CreateTeamSectionDto } from "./dto/create-team-section.dto";
import { GameType } from "src/common/enums/gameType";
import { PaginateQuery, paginate } from "nestjs-paginate";
import { TEAM_SECTIONS_PAGINATION_CONFIG } from "./teamSections.constants";
import { UpdateTeamSectionDto } from "./dto/update-team-section.dto";
import { User } from "src/users/entities/user.entity";
import { TeamSectionMembers } from "./entities/teamSectionMembers.entity";

@Injectable()
export class TeamSectionsService {
  constructor(
    @InjectRepository(TeamSection)
    private teamSectionsRepository: Repository<TeamSection>,
    @InjectRepository(TeamSectionMembers)
    private teamSectionMembersRepository: Repository<TeamSectionMembers>,
    private dataSource: DataSource
  ) {}

  async create(createTeamSectionDto: CreateTeamSectionDto) {
    const { members, ...data } = createTeamSectionDto

    const teamSection = this.teamSectionsRepository.create(data)
    teamSection.members = members.map((id) => ({ id } as User))

    return this.teamSectionsRepository.save(teamSection);
  }

  findAll(query?: PaginateQuery) {
    return paginate(
      query,
      this.teamSectionsRepository,
      TEAM_SECTIONS_PAGINATION_CONFIG
    );
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

  findByMembers(members: Array<number> = [], type?: GameType) {
    const ids = members.sort((a, b) => b - a)

    const initialQuery = this.dataSource.manager
      .getRepository(TeamSectionMembers)
      .createQueryBuilder("tsm")
      .select("tsm.team_section_id", "team_section_id")
      .addSelect("ts.type", "type")
      .leftJoin("team_section", "ts", "tsm.team_section_id = ts.id")
      .where("tsm.member_id IN (:...ids)", { ids });

    if (type) {
      initialQuery.andWhere("ts.type = :type", { type })
    }

    return initialQuery
      .groupBy("team_section_id, type")
      .having(`COUNT(team_section_id) = ${ids.length}`)
      .getRawMany();
  }

  async update(id: number, updateTeamSectionDto: UpdateTeamSectionDto) {
    const { members = [], ...data} = updateTeamSectionDto;

    const teamSection = this.teamSectionsRepository.create(data);
    teamSection.id = id;
    teamSection.members = members.map((id) => ({ id }) as User);

    return this.teamSectionsRepository.save(teamSection);
  }

  remove(id: number) {
    return this.teamSectionsRepository.delete({ id });
  }
}
