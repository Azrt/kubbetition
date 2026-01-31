import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { In, IsNull, Repository } from 'typeorm';
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
  ) {}

  async create(createGameDto: CreateGameDto, currentUser: User) {
    const { participants, ...data } = createGameDto;

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
    });

    const savedGame = await this.gamesRepository.save(game);

    // Load and assign participants if provided
    if (participants && participants.length > 0) {
      const participantUsers = await this.usersRepository.findBy({ id: In(participants) });
      savedGame.participants = participantUsers;
      await this.gamesRepository.save(savedGame);
    }

    return this.findOne(savedGame.id);
  }

  async updateSocialPhoto(id: number, photoUrl: string) {
    await this.gamesRepository.update(id, { socialPhoto: photoUrl });
    return this.findOne(id);
  }

  async endGame(id: number) {
    await this.gamesRepository.update(id, {
      endTime: new Date(),
    });

    const game = await this.findOne(id);

    // Invalidate cache for all participants
    if (game) {
      await this.invalidateHistoryCacheForGame(game);
    }

    return game;
  }

  async startGame(id: number) {
    await this.gamesRepository.update(id, {
      startTime: new Date(),
    });

    return this.findOne(id);
  }

  private eventParticipantWhereClause(): string {
    // Checks whether event.participants (json) contains userId in any inner team array.
    // Assumes Postgres jsonb.
    // Use jsonb_array_elements_text to extract array elements as text, then cast and compare
    // Cast :userId to INTEGER explicitly to avoid parameter type inference issues
    return `EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(event.participants, '[]')::jsonb) team
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(team) user_id_text
        WHERE user_id_text::int = CAST(:userId AS INTEGER)
      )
    )`;
  }

  findAll(query: PaginateQuery, currentUser: User) {
    const qb = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.createdBy', 'createdBy')
      .leftJoinAndSelect('game.participants', 'participants')
      .leftJoinAndSelect('game.team1Members', 'team1Members')
      .leftJoinAndSelect('team1Members.team', 'team1MembersTeam')
      .leftJoinAndSelect('game.team2Members', 'team2Members')
      .leftJoinAndSelect('team2Members.team', 'team2MembersTeam')
      .leftJoinAndSelect('game.event', 'event');

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

  async findOne(id: number, currentUser?: User) {
    const game = await this.gamesRepository.findOne({
      relations: GAME_RELATIONS,
      where: { id },
    });

    if (game) {
      if (game.event && game.event.isPublic === false && currentUser && !isAdminRole(currentUser)) {
        const teams = game.event.participants || [];
        const isParticipant = teams.some((t) => Array.isArray(t) && t.includes(currentUser.id));
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

  async cancelGame(id: number) {
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

  async update(id: number, updateGameDto: UpdateGameDto, user: User) {
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

  remove(id: number) {
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

  async findUserHistory(userId: number, query?: PaginateQuery): Promise<Paginated<Game>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const cacheKey = RedisService.gameHistoryKey(userId, page, limit);

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
      .andWhere('game.isCancelled = :isCancelled', { isCancelled: false })
      .andWhere(
        '(team1Members.id = :userId OR team2Members.id = :userId)',
        { userId }
      )
      .orderBy('game.endTime', 'DESC');

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

  // Team operations
  async joinTeam(gameId: number, team: 1 | 2, user: User) {
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

  async leaveTeam(gameId: number, user: User) {
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

  async setTeamReady(gameId: number, team: 1 | 2, user: User) {
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

  async updateTeamScore(gameId: number, team: 1 | 2, score: number, user: User) {
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
    const userIds = new Set<number>();
    
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
  async canAccessGameSocialPhoto(gameId: number, user: User): Promise<boolean> {
    // Admins always have access
    if (isAdminRole(user)) {
      return true;
    }

    const game = await this.findOne(gameId);
    if (!game || !game.socialPhoto) {
      return false;
    }

    // Collect all participant IDs
    const participantIds = new Set<number>();
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
