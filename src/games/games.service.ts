import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { IsNull, Repository } from 'typeorm';
import { PaginateQuery, Paginated, paginate } from 'nestjs-paginate';
import { GAMES_PAGINATION_CONFIG, GAME_RELATIONS } from './games.constants';
import { User } from 'src/users/entities/user.entity';
import { GamesServiceInterface } from './interfaces/games.service.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameReadyEvent, GAME_READY_EVENT } from './events/game-ready.event';
import { GameUpdateEvent, GAME_UPDATE_EVENT } from './events/game-update.event';
import { RedisService } from 'src/common/services/redis.service';

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
  ) {}

  async create(createGameDto: CreateGameDto, currentUser: User) {
    const { participants, ...data } = createGameDto;

    const game = this.gamesRepository.create({
      ...data,
      createdBy: currentUser,
      team1Members: [],
      team2Members: [],
      team1Score: null,
      team2Score: null,
      team1Ready: false,
      team2Ready: false,
    });

    const savedGame = await this.gamesRepository.save(game);
    return this.findOne(savedGame.id);
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

  findAll(query?: PaginateQuery) {
    return paginate(query, this.gamesRepository, GAMES_PAGINATION_CONFIG);
  }

  async findOne(id: number) {
    const game = await this.gamesRepository.findOne({
      relations: GAME_RELATIONS,
      where: { id },
    });

    if (game) {
      this.computeGameProperties(game);
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

  update(id: number, updateGameDto: UpdateGameDto) {
    return this.gamesRepository.save({
      id,
      ...updateGameDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }

  async findAllUserActive(user: User) {
    const games = await this.gamesRepository.find({
      relations: GAME_RELATIONS,
      where: [
        { endTime: IsNull(), team1Members: { id: user?.id } },
        { endTime: IsNull(), team2Members: { id: user?.id } },
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

    const teamMembers = team === 1 ? game.team1Members : game.team2Members;
    const isInTeam = teamMembers?.some(m => m.id === user.id);

    if (!isInTeam) {
      throw new BadRequestException('User not in this team');
    }

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

    if (!game.isGameReady) {
      throw new BadRequestException('Game is not ready yet');
    }

    if (game.endTime) {
      throw new BadRequestException('Game already ended');
    }

    if (game.isCancelled) {
      throw new BadRequestException('Game is cancelled');
    }

    const teamMembers = team === 1 ? game.team1Members : game.team2Members;
    const isInTeam = teamMembers?.some(m => m.id === user.id);

    if (!isInTeam) {
      throw new BadRequestException('User not in this team');
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
}
