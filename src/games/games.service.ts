import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { DataSource, Repository } from 'typeorm';
import { Score } from 'src/scores/entities/score.entity';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { GAMES_PAGINATION_CONFIG, GAME_RELATIONS } from './games.constants';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Score)
    private scoresRepository: Repository<Score>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource
  ) {}
  async create(createGameDto: CreateGameDto, currentUser: User) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const { firstTeam, secondTeam, participants, ...data } = createGameDto;

      const members = participants.map((id) => this.usersRepository.create({ id }));

      const gameData = await this.gamesRepository.create({
        ...data,
        createdBy: currentUser,
        members,
      });

      const game = await queryRunner.manager.save(gameData);

      const firstTeamScoreData = this.scoresRepository.create({
        members: [],
        score: null,
        game,
      });

      const secondTeamScoreData = this.scoresRepository.create({
        members: [],
        score: null,
        game,
      });

      await queryRunner.manager.save(firstTeamScoreData);
      await queryRunner.manager.save(secondTeamScoreData);

      await queryRunner.commitTransaction();

      return game;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      throw new BadRequestException();
    } finally {
      await queryRunner.release();
    }
  }

  endGame(id: number) {
    const game = this.gamesRepository.create({
      id,
      endTime: new Date().toISOString(),
    });

    return this.gamesRepository.save(game);
  }

  startGame(id: number) {
    const game = this.gamesRepository.create({
      id,
      startTime: new Date().toISOString(),
    });

    return this.gamesRepository.save(game);
  }

  findAll(query?: PaginateQuery) {
    return paginate(query, this.gamesRepository, GAMES_PAGINATION_CONFIG);
  }

  findOne(id: number) {
    return this.gamesRepository.findOne({
      relations: GAME_RELATIONS,
      where: {
        id,
      },
    });
  }

  findOneByScore(scoreId: number) {
    return this.gamesRepository.findOne({
      relations: GAME_RELATIONS,
      where: {
        scores: {
          id: scoreId,
        },
      },
    });
  }

  cancelGame(id: number) {
    const game = this.gamesRepository.create({
      id,
      isCancelled: true,
    });
  
    return this.gamesRepository.save(game);
  }

  update(id: number, updateGameDto: UpdateGameDto) {
    return `This action updates a #${id} game`;
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }

  findAllUserActive(user: User) {
    return this.gamesRepository.find({
      relations: GAME_RELATIONS,
      where: {
        endTime: null,
        members: {
          id: user?.id,
        },
      },
    });
  }
}
