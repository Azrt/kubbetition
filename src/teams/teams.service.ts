import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { TEAMS_PAGINATION_CONFIG } from './teams.constants';
import { UpdateTeamMembersDto } from "./dto/update-team.dto";
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';
import { GameType } from 'src/common/enums/gameType';

@Injectable()
export class TeamsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(createTeamDto: CreateTeamDto, user: User) {
    const isUserRole = user.role === Role.USER;

    if (user.team) {
      throw new BadRequestException(
        "Cannot create new team if user already belong to one"
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const teamData = this.teamsRepository.create(createTeamDto);

      const team = await queryRunner.manager.save(teamData);

      if (isUserRole) {
        const userData = this.userRepository.create({
          id: user.id,
          role: Role.SUPERVISOR,
          team,
        });

        await queryRunner.manager.save(userData);
      }

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();

      throw new BadRequestException();
    } finally {
      await queryRunner.release();
    }
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

  async update(id: number, updateTeamDto: UpdateTeamMembersDto) {
    const team = this.teamsRepository.create(
      updateTeamDto as unknown as Team
    );
    team.id = id;

    if (updateTeamDto.members) {
      team.members = updateTeamDto.members.map((id) => ({ id }) as User);
    }

    return this.teamsRepository.save(team);
  }

  remove(id: number) {
    return this.teamsRepository.delete({ id });
  }
}
