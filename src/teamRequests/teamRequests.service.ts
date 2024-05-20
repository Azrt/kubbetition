import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { TeamRequest } from "./entities/team-request.entity";
import { CreateTeamRequestDto } from "./dto/create-team-request.dto";
import { PaginateConfig, PaginateQuery, paginate } from "nestjs-paginate";
import { TEAM_REQUESTS_PAGINATION_CONFIG } from "./teamRequests.constants";
import { User } from "src/users/entities/user.entity";
import { Team } from "src/teams/entities/team.entity";
import { TeamRequestStatus } from "./enums/teamRequestStatus.enum";
import { isAdminRole, isUserRole } from "src/common/helpers/user";

@Injectable()
export class TeamRequestsService {
  constructor(
    @InjectRepository(TeamRequest)
    private teamRequestsRepository: Repository<TeamRequest>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource
  ) {}

  async create(createTeamRequestDto: CreateTeamRequestDto, initialUser: User) {
    const {
      team: dtoTeam,
      user: dtoUser,
      ...teamRequestData
    } = createTeamRequestDto;
    const isAdmin = isAdminRole(initialUser);

    if (isAdmin && !dtoUser) throw new BadRequestException("Missing user id")

    const team = this.teamsRepository.create({ id: dtoTeam });
    const user = this.usersRepository.create({
      id: isAdmin ? dtoUser : initialUser.id,
    });

    const existingTeamRequest = await this.findByUserId(user.id);

    if (existingTeamRequest) throw new BadRequestException("User already has a team request")
  
    const teamRequest = this.teamRequestsRepository.create({
      ...teamRequestData,
      user,
      team,
    });

    return this.teamRequestsRepository.save(teamRequest);
  }

  findOne(id: number) {
    return this.teamRequestsRepository.findOne({
      where: { id },
      relations: ['team', 'user'],
    });
  }

  findAll(query: PaginateQuery, user: User) {
    const isUser = isUserRole(user);
    const config: PaginateConfig<TeamRequest> = {
      ...TEAM_REQUESTS_PAGINATION_CONFIG,
      ...(isUser && {
        where: {
          team: {
            id: user.team?.id,
          },
        },
      }),
    };

    return paginate(query, this.teamRequestsRepository, config);
  }

  findByUserId(id: number) {
    return this.teamRequestsRepository.find({
      where: {
        status: In([TeamRequestStatus.IN_PROGRESS, TeamRequestStatus.BLOCKED]),
        user: {
          id,
        },
      },
    });
  }

  async acceptTeamRequest(id: number, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const teamRequest = await this.findOne(id)

      const team = this.teamsRepository.create({
        id: teamRequest.team.id,
      })
  
      const user = this.usersRepository.create({
        id: teamRequest.user.id,
        team,
      })
  
      const updatedUser = await queryRunner.manager.save(user);

      const updatedTeamRequest = this.teamRequestsRepository.create({
        id: teamRequest.id,
        status: TeamRequestStatus.APPROVED,
        user: updatedUser,
      });

      await queryRunner.manager.save(updatedTeamRequest);
    } catch (e) {
      await queryRunner.rollbackTransaction();

      throw new BadRequestException();
    } finally {
      await queryRunner.release();
    }
  }

  remove(id: number) {
    return this.teamRequestsRepository.delete({ id });
  }
}