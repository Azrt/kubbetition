import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { DataSource, EntitySubscriberInterface, EventSubscriber, In, InsertEvent, Repository, UpdateEvent } from 'typeorm';
import { Score } from 'src/scores/entities/score.entity';
import { TeamSection } from 'src/teamSections/entities/teamSection.entity';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { GAMES_PAGINATION_CONFIG, GAME_RELATIONS } from './games.constants';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Score)
    private scoresRepository: Repository<Score>,
    @InjectRepository(TeamSection)
    private teamSectionsRepository: Repository<TeamSection>,
    private dataSource: DataSource
  ) {}
  async create(createGameDto: CreateGameDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const { firstSection, secondSection, ...data } = createGameDto;

      const gameData = await this.gamesRepository.create(data);

      const game = await queryRunner.manager.save(gameData);

      const firstTeamSection = this.teamSectionsRepository.create({
        id: firstSection,
      });
  
      const secondTeamSection = this.teamSectionsRepository.create({
        id: secondSection,
      });

      const firstTeamScoreData = this.scoresRepository.create({
        teamSection: firstTeamSection,
        score: null,
        game,
      });

      const secondTeamScoreData = this.scoresRepository.create({
        teamSection: secondTeamSection,
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
    return this.gamesRepository.save({
      id,
      endTime: new Date().toISOString(),
    })
  }

  findAll(query?: PaginateQuery) {
    return paginate(query, this.gamesRepository, GAMES_PAGINATION_CONFIG);
  }

  async findOne(id: number) {
    return await this.gamesRepository.findOne({
      relations: GAME_RELATIONS,
      where: {
        id,
      },
    });
  }

  async findOneByScore(scoreId: number) {
    return await this.gamesRepository.findOne({
      relations: GAME_RELATIONS,
      where: {
        scores: {
          id: scoreId,
        },
      },
    });
  }

  update(id: number, updateGameDto: UpdateGameDto) {
    return `This action updates a #${id} game`;
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }
}
