import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Brackets, In, IsNull, LessThan, Repository } from 'typeorm';
import { PaginateQuery, Paginated, paginate } from 'nestjs-paginate';
import { GAMES_PAGINATION_CONFIG, GAME_RELATIONS } from './games.constants';
import { User } from 'src/users/entities/user.entity';
import { GamesServiceInterface } from './interfaces/games.service.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameReadyEvent, GAME_READY_EVENT } from './events/game-ready.event';
import { GameUpdateEvent, GAME_UPDATE_EVENT } from './events/game-update.event';
import { RedisService } from 'src/common/services/redis.service';
import { isAdminRole } from 'src/common/helpers/user';
import { UsersService } from 'src/users/users.service';
import { FileUploadService, FileType } from 'src/common/services/file-upload.service';
import { DivisionsService } from 'src/teams/divisions/divisions.service';
import { DIVISION_GAME_TYPES } from 'src/common/enums/gameType';

const HISTORY_CACHE_TTL = 300000; // 5 minutes in ms

@Injectable()
export class GamesService implements GamesServiceInterface {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
    private redisService: RedisService,
    private usersService: UsersService,
    private fileUploadService: FileUploadService,
    private divisionsService: DivisionsService,
  ) {}

  async create(createGameDto: CreateGameDto, currentUser: User) {
    const {
      participants,
      randomize = false,
      team1DivisionId,
      team2DivisionId,
      ...data
    } = createGameDto;

    const useDivisions = !!team1DivisionId && !!team2DivisionId;
    if (team1DivisionId && !team2DivisionId) {
      throw new BadRequestException(
        'team1DivisionId and team2DivisionId must be provided together',
      );
    }
    if (team2DivisionId && !team1DivisionId) {
      throw new BadRequestException(
        'team1DivisionId and team2DivisionId must be provided together',
      );
    }
    if (useDivisions && !DIVISION_GAME_TYPES.includes(data.type)) {
      throw new BadRequestException(
        'Game type must be 2v2, 3v3, 4v4, or 6v6 when using divisions (1v1 is not supported for divisions)',
      );
    }

    const game = this.gamesRepository.create({
      ...data,
      createdBy: currentUser,
      team1Members: [],
      team2Members: [],
      participants: [],
      team1Score: null,
      team2Score: null,
      team1Ready: false,
      team2Ready: false,
      winner: null,
    });

    const savedGame = await this.gamesRepository.save(game);

    if (useDivisions) {
      const [team1Ids, team2Ids] = await Promise.all([
        this.divisionsService.getDivisionMemberIdsByType(team1DivisionId!, data.type),
        this.divisionsService.getDivisionMemberIdsByType(team2DivisionId!, data.type),
      ]);
      const team1Users = await this.usersRepository.findBy({ id: In(team1Ids) });
      const team2Users = await this.usersRepository.findBy({ id: In(team2Ids) });
      if (team1Users.length !== data.type || team2Users.length !== data.type) {
        throw new BadRequestException(
          'One or both divisions do not have the required number of members',
        );
      }
      savedGame.team1Division = { id: team1DivisionId! } as any;
      savedGame.team2Division = { id: team2DivisionId! } as any;
      savedGame.team1Members = team1Users;
      savedGame.team2Members = team2Users;
      savedGame.participants = [...team1Users, ...team2Users];
      await this.gamesRepository.save(savedGame);
    } else if (participants && participants.length > 0) {
      const participantUsers = await this.usersRepository.findBy({ id: In(participants) });
      savedGame.participants = participantUsers;

      if (randomize && participantUsers.length >= 2) {
        const shuffled = this.shuffleArray([...participantUsers]);
        const half = Math.floor(shuffled.length / 2);
        savedGame.team1Members = shuffled.slice(0, half);
        savedGame.team2Members = shuffled.slice(half);
      }

      await this.gamesRepository.save(savedGame);
    }

    return this.findOne(savedGame.id);
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async updateSocialPhoto(id: string, photoUrl: string) {
    await this.gamesRepository.update(id, { socialPhoto: photoUrl });
    return this.findOne(id);
  }

  async endGame(id: string) {
    const game = await this.gamesRepository.findOne({
      where: { id },
      select: ['id', 'team1Score', 'team2Score'],
    });
    let winner: 1 | 2 | null = null;
    if (game?.team1Score !== null && game?.team2Score !== null) {
      if (game.team1Score > game.team2Score) winner = 1;
      else if (game.team2Score > game.team1Score) winner = 2;
    }
    await this.gamesRepository.update(id, {
      endTime: new Date(),
      ...(game?.team1Score != null && game?.team2Score != null ? { winner } : {}),
    });

    const updated = await this.findOne(id);

    if (updated) {
      await this.invalidateHistoryCacheForGame(updated);
    }

    return updated;
  }

  /**
   * Finds all non-ended games that started more than an hour ago,
   * sets score 0 for teams that did not submit, and ends the games.
   * Used by the hourly cron to auto-close stale games.
   */
  async closeStaleUnfinishedGames(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const staleGames = await this.gamesRepository.find({
      relations: GAME_RELATIONS,
      where: {
        endTime: IsNull(),
        isCancelled: false,
        startTime: LessThan(oneHourAgo),
      },
    });

    for (const game of staleGames) {
      const team1Score = game.team1Score ?? 0;
      const team2Score = game.team2Score ?? 0;
      let winner: 1 | 2 | null = null;
      if (team1Score > team2Score) winner = 1;
      else if (team2Score > team1Score) winner = 2;
      await this.gamesRepository.update(game.id, {
        team1Score,
        team2Score,
        endTime: new Date(),
        winner,
      });
      await this.invalidateHistoryCacheForGame(game);
    }

    return staleGames.length;
  }

  async startGame(id: string) {
    await this.gamesRepository.update(id, {
      startTime: new Date(),
    });

    return this.findOne(id);
  }

  private eventParticipantWhereClause(): string {
    // Checks whether event.participants (json) contains userId in any inner team array.
    // Assumes Postgres jsonb.
    // Use jsonb_array_elements_text to extract array elements as text, then compare as UUID
    return `EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(event.participants, '[]')::jsonb) team
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(team) user_id_text
        WHERE user_id_text::uuid = CAST(:userId AS UUID)
      )
    )`;
  }

  findAll(query: PaginateQuery, currentUser: User, includeCancelled = false) {
    const qb = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.createdBy', 'createdBy')
      .leftJoinAndSelect('game.participants', 'participants')
      .leftJoinAndSelect('game.team1Members', 'team1Members')
      .leftJoinAndSelect('team1Members.team', 'team1MembersTeam')
      .leftJoinAndSelect('game.team2Members', 'team2Members')
      .leftJoinAndSelect('team2Members.team', 'team2MembersTeam')
      .leftJoinAndSelect('game.event', 'event');

    if (!includeCancelled) {
      qb.andWhere('game.isCancelled = :isCancelled', { isCancelled: false });
    }

    if (!isAdminRole(currentUser)) {
      // For regular users, filter by:
      // 1. Games where user is in game.participants (ManyToMany relation)
      // 2. OR public events where user is a participant
      qb.andWhere(
        `(
          participants.id = :userId 
          OR (event.isPublic = true AND ${this.eventParticipantWhereClause()})
        )`,
        { userId: currentUser.id },
      );
    }

    return paginate(query, qb, {
      ...GAMES_PAGINATION_CONFIG,
      relations: undefined,
    } as any);
  }

  /**
   * Games where the given division played (as team1 or team2). User must have access to the division (team member or admin).
   */
  async findDivisionHistory(
    divisionId: string,
    teamId: string,
    currentUser: User,
    query: PaginateQuery,
  ): Promise<Paginated<Game>> {
    await this.divisionsService.findOne(teamId, divisionId, currentUser);

    const qb = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.createdBy', 'createdBy')
      .leftJoinAndSelect('game.team1Division', 'team1Division')
      .leftJoinAndSelect('game.team2Division', 'team2Division')
      .leftJoinAndSelect('game.team1Members', 'team1Members')
      .leftJoinAndSelect('team1Members.team', 'team1MembersTeam')
      .leftJoinAndSelect('game.team2Members', 'team2Members')
      .leftJoinAndSelect('team2Members.team', 'team2MembersTeam')
      .leftJoinAndSelect('game.event', 'event')
      .where('(team1Division.id = :divisionId OR team2Division.id = :divisionId)', { divisionId })
      .andWhere('game.isCancelled = :isCancelled', { isCancelled: false })
      .andWhere('game.endTime IS NOT NULL')
      .orderBy('game.endTime', 'DESC');

    const result = await paginate(query, qb, {
      sortableColumns: ['id', 'endTime', 'startTime', 'createdAt'],
      defaultSortBy: [['endTime', 'DESC']],
      maxLimit: 50,
    });
    result.data.forEach((g) => this.computeGameProperties(g));
    return result;
  }

  /**
   * Aggregate stats for a division (wins, losses, draws, points for/against). User must have access to the division.
   */
  async getDivisionStats(
    divisionId: string,
    teamId: string,
    currentUser: User,
  ): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDifferential: number;
  }> {
    await this.divisionsService.findOne(teamId, divisionId, currentUser);

    const games = await this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.team1Division', 'team1Division')
      .leftJoinAndSelect('game.team2Division', 'team2Division')
      .where('(team1Division.id = :divisionId OR team2Division.id = :divisionId)', { divisionId })
      .andWhere('game.endTime IS NOT NULL')
      .andWhere('game.isCancelled = :isCancelled', { isCancelled: false })
      .getMany();

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const game of games) {
      const isTeam1 = game.team1Division?.id === divisionId;
      const pf = isTeam1 ? (game.team1Score ?? 0) : (game.team2Score ?? 0);
      const pa = isTeam1 ? (game.team2Score ?? 0) : (game.team1Score ?? 0);
      pointsFor += pf;
      pointsAgainst += pa;
      if (game.winner === null) {
        draws++;
      } else if ((game.winner === 1 && isTeam1) || (game.winner === 2 && !isTeam1)) {
        wins++;
      } else {
        losses++;
      }
    }

    const totalGames = games.length;
    const winRate = totalGames > 0 ? wins / totalGames : 0;

    return {
      totalGames,
      wins,
      losses,
      draws,
      winRate,
      pointsFor,
      pointsAgainst,
      pointDifferential: pointsFor - pointsAgainst,
    };
  }

  async findOne(id: string, currentUser?: User) {
    const game = await this.gamesRepository.findOne({
      relations: GAME_RELATIONS,
      where: { id },
    });

    if (game) {
      if (game.event && game.event.isPublic === false && currentUser && !isAdminRole(currentUser)) {
        const teams = game.event.participants || [];
        const isParticipant = teams.some((t) => {
          const ids = Array.isArray(t) ? t : (t as { userIds: string[] }).userIds;
          return ids.includes(currentUser.id);
        });
        if (!isParticipant) {
          throw new ForbiddenException('You are not allowed to access this game');
        }
      }
      this.computeGameProperties(game);

      // Hide social photo if user doesn't have access (private S3 objects require presigned URLs)
      // Clients should use the dedicated endpoint to get presigned URLs
      if (game.socialPhoto && currentUser) {
        const hasAccess = await this.canAccessGameSocialPhoto(id, currentUser);
        if (!hasAccess) {
          game.socialPhoto = null;
        }
      } else if (game.socialPhoto && !currentUser) {
        // No user provided, hide the photo (requires authentication)
        game.socialPhoto = null;
      }
    }

    return game;
  }

  async cancelGame(id: string) {
    const game = await this.findOne(id);
    
    await this.gamesRepository.save({
      id,
      isCancelled: true,
    });

    // Invalidate cache for participants if game was completed
    if (game?.endTime) {
      await this.invalidateHistoryCacheForGame(game);
    }

    return this.findOne(id);
  }

  async update(id: string, updateGameDto: UpdateGameDto, user: User) {
    const game = await this.findOne(id);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Check if trying to update team members
    const isUpdatingTeamMembers = 
      (updateGameDto as any).team1Members !== undefined || 
      (updateGameDto as any).team2Members !== undefined;

    if (isUpdatingTeamMembers) {
      // Authorization check: only admin/superadmin or participants can update team members
      if (!this.canUpdateTeamMembers(game, user)) {
        throw new ForbiddenException('You are not authorized to update team members. Only admins or participants can update team members.');
      }
    }

    // Handle participants separately if provided
    const { participants, ...updateData } = updateGameDto as any;
    const gameUpdate: any = {
      id,
      ...updateData,
    };

    // If participants are provided, load the User entities
    if (participants && Array.isArray(participants)) {
      const participantUsers = await this.usersRepository.findBy({ id: In(participants) });
      gameUpdate.participants = participantUsers;
    }

    const savedGame = await this.gamesRepository.save(gameUpdate);
    return this.findOne(savedGame.id);
  }

  remove(id: string) {
    return `This action removes a #${id} game`;
  }

  async findAllUserActive(user: User) {
    const games = await this.gamesRepository.find({
      relations: GAME_RELATIONS,
      where: [
        { endTime: IsNull(), participants: { id: user?.id } },
      ],
    });

    games.forEach(game => this.computeGameProperties(game));
    return games;
  }

  async findUserHistory(userId: string, query?: PaginateQuery, includeCancelled = false): Promise<Paginated<Game>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const cacheKey = RedisService.gameHistoryKey(userId, page, limit, includeCancelled);

    // Try to get from cache
    const cached = await this.redisService.get<Paginated<Game>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query from database
    const queryBuilder = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.createdBy', 'createdBy')
      .leftJoinAndSelect('game.team1Members', 'team1Members')
      .leftJoinAndSelect('team1Members.team', 'team1MembersTeam')
      .leftJoinAndSelect('game.team2Members', 'team2Members')
      .leftJoinAndSelect('team2Members.team', 'team2MembersTeam')
      .where('game.endTime IS NOT NULL')
      .andWhere(
        '(team1Members.id = :userId OR team2Members.id = :userId)',
        { userId }
      )
      .orderBy('game.endTime', 'DESC');

    if (!includeCancelled) {
      queryBuilder.andWhere('game.isCancelled = :isCancelled', { isCancelled: false });
    }

    const result = await paginate(query, queryBuilder, {
      sortableColumns: ['id', 'endTime', 'startTime'],
      defaultSortBy: [['endTime', 'DESC']],
      maxLimit: 50,
    });

    // Compute properties for each game
    result.data.forEach(game => this.computeGameProperties(game));

    // Store in cache
    await this.redisService.set(cacheKey, result, HISTORY_CACHE_TTL);

    return result;
  }

  /**
   * Returns history of games played by the current user against a specific group of opponents
   * (e.g. 3v3: the three people on the other team), with aggregate stats (wins, losses, draws, win rate).
   * Opponent group is matched by exact set: the other team must consist exactly of the given user IDs.
   */
  async findSummaryAgainstOpponents(
    currentUser: User,
    opponentIds: string[],
    options?: { gameType?: number; limit?: number },
  ): Promise<{ summary: { totalGames: number; wins: number; losses: number; draws: number; winRate: number }; games: Game[] }> {
    const len = opponentIds.length;
    const limit = Math.min(options?.limit ?? 50, 100);
    const params = {
      userId: currentUser.id,
      opponentIds,
      len,
      isCancelled: false,
      gameType: options?.gameType,
    };

    const qb = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.createdBy', 'createdBy')
      .leftJoinAndSelect('game.team1Members', 'team1Members')
      .leftJoinAndSelect('team1Members.team', 'team1MembersTeam')
      .leftJoinAndSelect('game.team2Members', 'team2Members')
      .leftJoinAndSelect('team2Members.team', 'team2MembersTeam')
      .leftJoinAndSelect('game.event', 'event')
      .where('game.endTime IS NOT NULL')
      .andWhere('game.isCancelled = :isCancelled', { isCancelled: params.isCancelled })
      .andWhere(
        new Brackets((qb2) => {
          qb2
            .where('team1Members.id = :userId')
            .andWhere(
              `EXISTS (
                SELECT 1 FROM game_team2_members g2
                WHERE g2.game_id = game.id
                GROUP BY g2.game_id
                HAVING COUNT(*) = :len AND COUNT(CASE WHEN g2.member_id IN (:...opponentIds) THEN 1 END) = :len
              )`,
            )
            .orWhere(
              new Brackets((qb3) => {
                qb3
                  .where('team2Members.id = :userId')
                  .andWhere(
                    `EXISTS (
                      SELECT 1 FROM game_team1_members g1
                      WHERE g1.game_id = game.id
                      GROUP BY g1.game_id
                      HAVING COUNT(*) = :len AND COUNT(CASE WHEN g1.member_id IN (:...opponentIds) THEN 1 END) = :len
                    )`,
                  );
              }),
            );
        }),
      )
      .orderBy('game.endTime', 'DESC')
      .take(limit);

    if (params.gameType != null) {
      qb.andWhere('game.type = :gameType', { gameType: params.gameType });
    }

    qb.setParameters({ userId: params.userId, opponentIds: params.opponentIds, len: params.len });

    const games = await qb.getMany();

    games.forEach((g) => this.computeGameProperties(g));

    let wins = 0;
    let losses = 0;
    let draws = 0;
    for (const g of games) {
      const myTeam = g.team1Members?.some((m) => m.id === currentUser.id) ? 1 : 2;
      if (g.winner === null) draws++;
      else if (g.winner === myTeam) wins++;
      else losses++;
    }
    const totalGames = games.length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return {
      summary: { totalGames, wins, losses, draws, winRate },
      games,
    };
  }

  // Team operations
  async joinTeam(gameId: string, team: 1 | 2, user: User) {
    const game = await this.findOne(gameId);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Authorization check: only admin/superadmin or participants can add members to teams
    if (!this.canUpdateTeamMembers(game, user)) {
      throw new ForbiddenException('You are not authorized to join teams in this game. Only admins or participants can join teams.');
    }

    const teamKey = team === 1 ? 'team1Members' : 'team2Members';
    const currentMembers = game[teamKey] || [];

    // Check if user already in a team
    const inTeam1 = game.team1Members?.some(m => m.id === user.id);
    const inTeam2 = game.team2Members?.some(m => m.id === user.id);

    if (inTeam1 || inTeam2) {
      throw new BadRequestException('User already joined a team');
    }

    // Check team size
    if (currentMembers.length >= game.type) {
      throw new BadRequestException('Team is full');
    }

    await this.gamesRepository
      .createQueryBuilder()
      .relation(Game, teamKey)
      .of(gameId)
      .add(user.id);

    return this.findOne(gameId);
  }

  async leaveTeam(gameId: string, user: User) {
    const game = await this.findOne(gameId);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const inTeam1 = game.team1Members?.some(m => m.id === user.id);
    const inTeam2 = game.team2Members?.some(m => m.id === user.id);

    if (!inTeam1 && !inTeam2) {
      throw new BadRequestException('User not in any team');
    }

    const teamKey = inTeam1 ? 'team1Members' : 'team2Members';

    await this.gamesRepository
      .createQueryBuilder()
      .relation(Game, teamKey)
      .of(gameId)
      .remove(user.id);

    return this.findOne(gameId);
  }

  async setTeamReady(gameId: string, team: 1 | 2, user: User) {
    const game = await this.findOne(gameId);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Authorization check: only admin/superadmin or team members can update their team's ready status
    if (!this.canUpdateTeamReady(game, team, user)) {
      throw new ForbiddenException('You are not authorized to update this team\'s ready status');
    }

    const teamMembers = team === 1 ? game.team1Members : game.team2Members;

    // Check team has required members
    if (teamMembers.length !== game.type) {
      throw new BadRequestException(`Team needs exactly ${game.type} members`);
    }

    const readyKey = team === 1 ? 'team1Ready' : 'team2Ready';
    await this.gamesRepository.update(gameId, { [readyKey]: true });

    const updatedGame = await this.findOne(gameId);

    // Auto-start game if both teams ready
    if (updatedGame.isGameReady && !updatedGame.startTime) {
      const gameReadyEvent = new GameReadyEvent(gameId);
      this.eventEmitter.emit(GAME_READY_EVENT, gameReadyEvent);
      return this.startGame(gameId);
    }

    return updatedGame;
  }

  async updateTeamScore(gameId: string, team: 1 | 2, score: number, user: User) {
    const game = await this.findOne(gameId);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Authorization check: only admin/superadmin or team members can update their team's score
    if (!this.canUpdateTeamScore(game, team, user)) {
      throw new ForbiddenException('You are not authorized to update this team\'s score');
    }

    if (!game.isGameReady) {
      throw new BadRequestException('Game is not ready yet');
    }

    if (game.endTime) {
      throw new BadRequestException('Game already ended');
    }

    if (game.isCancelled) {
      throw new BadRequestException('Game is cancelled');
    }

    const scoreKey = team === 1 ? 'team1Score' : 'team2Score';
    await this.gamesRepository.update(gameId, { [scoreKey]: score });

    const updatedGame = await this.findOne(gameId);

    // Auto-end game if both scores submitted
    if (updatedGame.team1Score !== null && updatedGame.team2Score !== null) {
      const gameUpdateEvent = new GameUpdateEvent(gameId);
      this.eventEmitter.emit(GAME_UPDATE_EVENT, gameUpdateEvent);
      return this.endGame(gameId);
    }

    return updatedGame;
  }

  // Authorization helpers
  private canUpdateTeamMembers(game: Game, user: User): boolean {
    // Admin or superadmin can always update
    if (isAdminRole(user)) {
      return true;
    }

    // Check if user is in participants list
    const isParticipant = game.participants?.some(p => p.id === user.id);
    return isParticipant || false;
  }

  private canUpdateTeamScore(game: Game, team: 1 | 2, user: User): boolean {
    // Admin or superadmin can always update
    if (isAdminRole(user)) {
      return true;
    }

    // Check if user is in the specified team
    const teamMembers = team === 1 ? game.team1Members : game.team2Members;
    const isInTeam = teamMembers?.some(m => m.id === user.id);
    return isInTeam || false;
  }

  private canUpdateTeamReady(game: Game, team: 1 | 2, user: User): boolean {
    // Admin or superadmin can always update
    if (isAdminRole(user)) {
      return true;
    }

    // Check if user is in the specified team
    const teamMembers = team === 1 ? game.team1Members : game.team2Members;
    const isInTeam = teamMembers?.some(m => m.id === user.id);
    return isInTeam || false;
  }

  // Helper to compute properties after loading
  private computeGameProperties(game: Game) {
    game.isGameReady = game.team1Ready && game.team2Ready;
    game.allMembers = [...(game.team1Members || []), ...(game.team2Members || [])];

    if (game.endTime && game.team1Score !== null && game.team2Score !== null) {
      if (game.team1Score > game.team2Score) {
        game.winner = 1;
      } else if (game.team2Score > game.team1Score) {
        game.winner = 2;
      } else {
        game.winner = null; // tie
      }
    } else {
      game.winner = null;
    }
  }

  // Invalidate history cache for all game participants
  private async invalidateHistoryCacheForGame(game: Game) {
    const userIds = new Set<string>();
    
    game.team1Members?.forEach(m => userIds.add(m.id));
    game.team2Members?.forEach(m => userIds.add(m.id));

    await Promise.all(
      Array.from(userIds).map(userId =>
        this.redisService.delByPattern(RedisService.gameHistoryPattern(userId))
      )
    );
  }

  /**
   * Check if a user has access to view a game's social photo.
   * Access is granted if:
   * 1. User is a participant in the game (participants, team1Members, or team2Members)
   * 2. User is a friend of any participant
   * 3. User is a team member of any participant (if participant has a team assigned)
   * 4. User is an admin/superadmin
   */
  async canAccessGameSocialPhoto(gameId: string, user: User): Promise<boolean> {
    // Admins always have access
    if (isAdminRole(user)) {
      return true;
    }

    const game = await this.findOne(gameId);
    if (!game || !game.socialPhoto) {
      return false;
    }

    // Collect all participant IDs
    const participantIds = new Set<string>();
    game.participants?.forEach(p => participantIds.add(p.id));
    game.team1Members?.forEach(m => participantIds.add(m.id));
    game.team2Members?.forEach(m => participantIds.add(m.id));

    // Check if user is a participant
    if (participantIds.has(user.id)) {
      return true;
    }

    // Get user's friends
    const userFriends = await this.usersService.getFriends(user);
    const friendIds = new Set(userFriends.map(f => f.id));

    // Check if user is a friend of any participant
    for (const participantId of participantIds) {
      if (friendIds.has(participantId)) {
        return true;
      }
    }

    // Check if user is a team member of any participant
    if (user.team) {
      const participantUsers = await this.usersRepository.find({
        where: { id: In(Array.from(participantIds)) },
        relations: ['team'],
      });

      for (const participant of participantUsers) {
        // If participant has a team and it's the same as user's team
        if (participant.team && participant.team.id === user.team.id) {
          return true;
        }
      }
    }

    return false;
  }
}
