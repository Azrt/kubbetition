import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Division } from '../entities/division.entity';
import { Team } from '../entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { GameType, DIVISION_GAME_TYPES } from 'src/common/enums/gameType';
import { isAdminRole, isSupervisorRole } from 'src/common/helpers/user';

@Injectable()
export class DivisionsService {
  constructor(
    @InjectRepository(Division)
    private divisionsRepository: Repository<Division>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private assertDivisionGameType(type: GameType): void {
    if (!DIVISION_GAME_TYPES.includes(type)) {
      throw new BadRequestException(
        `Division type must be one of 2v2, 3v3, 4v4, 6v6 (got ${type}). 1v1 is not allowed for divisions.`,
      );
    }
  }

  private assertMemberCountMatchesType(memberIds: string[], type: GameType): void {
    if (memberIds.length !== type) {
      throw new BadRequestException(
        `Division must have exactly ${type} members for ${type}v${type} type (provided ${memberIds.length}).`,
      );
    }
  }

  private async assertMembersBelongToTeam(teamId: string, memberIds: string[]): Promise<User[]> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    const teamMemberIds = new Set((team.members || []).map((m) => m.id));
    const invalid = memberIds.filter((id) => !teamMemberIds.has(id));
    if (invalid.length) {
      throw new BadRequestException(
        `The following user IDs are not members of this team: ${invalid.join(', ')}`,
      );
    }
    const users = await this.usersRepository.findBy({ id: In(memberIds) });
    if (users.length !== memberIds.length) {
      const foundIds = new Set(users.map((u) => u.id));
      const missing = memberIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Users not found: ${missing.join(', ')}`);
    }
    return users;
  }

  private async ensureTeamAccess(teamId: string, user: User): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    const isMember = team.members?.some((m) => m.id === user.id);
    if (!isMember && !isAdminRole(user)) {
      throw new ForbiddenException('You must be a team member or admin to manage divisions');
    }
    return team;
  }

  /** Only SUPERVISOR (of this team) or global admin can create, update or delete divisions. */
  private async ensureCanManageDivisions(teamId: string, user: User): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    if (isAdminRole(user)) {
      return team;
    }
    const isMember = team.members?.some((m) => m.id === user.id);
    if (!isMember || !isSupervisorRole(user)) {
      throw new ForbiddenException(
        'Only the team supervisor or an admin can create, update or delete divisions',
      );
    }
    return team;
  }

  /**
   * Returns a division of this team that has the exact same set of member IDs (order-independent).
   * Optionally exclude a division by id (e.g. when updating).
   */
  private async findDivisionWithSameMembers(
    teamId: string,
    memberIds: string[],
    excludeDivisionId?: string,
  ): Promise<Division | null> {
    const sortedIds = [...memberIds].sort();
    const divisions = await this.divisionsRepository.find({
      where: { team: { id: teamId } },
      relations: ['members'],
    });
    for (const div of divisions) {
      if (excludeDivisionId && div.id === excludeDivisionId) continue;
      const divIds = (div.members ?? []).map((m) => m.id).sort();
      if (divIds.length === sortedIds.length && divIds.every((id, i) => id === sortedIds[i])) {
        return div;
      }
    }
    return null;
  }

  async create(teamId: string, dto: CreateDivisionDto, user: User): Promise<Division> {
    await this.ensureCanManageDivisions(teamId, user);
    this.assertDivisionGameType(dto.type);
    this.assertMemberCountMatchesType(dto.memberIds, dto.type);

    const uniqueIds = [...new Set(dto.memberIds)];
    if (uniqueIds.length !== dto.memberIds.length) {
      throw new BadRequestException('memberIds must not contain duplicates');
    }

    const members = await this.assertMembersBelongToTeam(teamId, dto.memberIds);

    const existing = await this.findDivisionWithSameMembers(teamId, dto.memberIds);
    if (existing) {
      throw new ConflictException(
        'A division with the same members already exists in this team',
      );
    }

    const division = this.divisionsRepository.create({
      name: dto.name,
      type: dto.type,
      team: { id: teamId },
      members,
    });
    return this.divisionsRepository.save(division);
  }

  async findAllByTeam(teamId: string, user: User): Promise<Division[]> {
    await this.ensureTeamAccess(teamId, user);
    return this.divisionsRepository.find({
      where: { team: { id: teamId } },
      relations: ['members'],
      order: { name: 'ASC' },
    });
  }

  async findOne(teamId: string, divisionId: string, user: User): Promise<Division> {
    await this.ensureTeamAccess(teamId, user);
    const division = await this.divisionsRepository.findOne({
      where: { id: divisionId, team: { id: teamId } },
      relations: ['members', 'team'],
    });
    if (!division) {
      throw new NotFoundException('Division not found');
    }
    return division;
  }

  async update(
    teamId: string,
    divisionId: string,
    dto: UpdateDivisionDto,
    user: User,
  ): Promise<Division> {
    await this.ensureCanManageDivisions(teamId, user);
    const division = await this.findOne(teamId, divisionId, user);

    if (dto.type !== undefined) {
      this.assertDivisionGameType(dto.type);
    }
    const newType = dto.type ?? division.type;
    const newMemberIds = dto.memberIds ?? division.members?.map((m) => m.id) ?? [];
    this.assertMemberCountMatchesType(newMemberIds, newType);

    const uniqueIds = [...new Set(newMemberIds)];
    if (uniqueIds.length !== newMemberIds.length) {
      throw new BadRequestException('memberIds must not contain duplicates');
    }

    if (dto.memberIds) {
      const existing = await this.findDivisionWithSameMembers(
        teamId,
        dto.memberIds,
        divisionId,
      );
      if (existing) {
        throw new ConflictException(
          'Another division in this team already has the same members',
        );
      }
      division.members = await this.assertMembersBelongToTeam(teamId, dto.memberIds);
    }
    if (dto.name !== undefined) {
      division.name = dto.name;
    }
    if (dto.type !== undefined) {
      division.type = dto.type;
    }
    return this.divisionsRepository.save(division);
  }

  async remove(teamId: string, divisionId: string, user: User): Promise<void> {
    await this.ensureCanManageDivisions(teamId, user);
    await this.findOne(teamId, divisionId, user);
    await this.divisionsRepository.delete({ id: divisionId, team: { id: teamId } });
  }

  /**
   * Resolve a division to its member user IDs. Used by events/games when joining with divisionId.
   * Caller must ensure division type matches event/game type.
   */
  async getDivisionMemberIds(divisionId: string): Promise<string[] | null> {
    const division = await this.divisionsRepository.findOne({
      where: { id: divisionId },
      relations: ['members'],
    });
    if (!division || !division.members) {
      return null;
    }
    return division.members.map((m) => m.id);
  }

  /**
   * Get division by ID and team, and validate type matches expected game type.
   * Returns member IDs for use in event join (current user's team only).
   */
  async getDivisionMemberIdsForGameType(
    divisionId: string,
    teamId: string,
    gameType: GameType,
  ): Promise<string[]> {
    const division = await this.divisionsRepository.findOne({
      where: { id: divisionId, team: { id: teamId } },
      relations: ['members'],
    });
    if (!division) {
      throw new NotFoundException('Division not found');
    }
    if (division.type !== gameType) {
      throw new BadRequestException(
        `Division type (${division.type}v${division.type}) does not match game/event type (${gameType}v${gameType}).`,
      );
    }
    return division.members.map((m) => m.id);
  }

  /**
   * Get division member IDs by division ID and game type (no team check).
   * Used when creating games between two divisions (e.g. from different teams).
   */
  async getDivisionMemberIdsByType(divisionId: string, gameType: GameType): Promise<string[]> {
    const division = await this.divisionsRepository.findOne({
      where: { id: divisionId },
      relations: ['members'],
    });
    if (!division) {
      throw new NotFoundException(`Division with ID ${divisionId} not found`);
    }
    if (division.type !== gameType) {
      throw new BadRequestException(
        `Division type (${division.type}v${division.type}) does not match game type (${gameType}v${gameType}).`,
      );
    }
    return division.members.map((m) => m.id);
  }
}
