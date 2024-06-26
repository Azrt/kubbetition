import { Injectable } from '@nestjs/common';
import { UpdateScoreDto } from './dto/update-score.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { Repository } from 'typeorm';
import { SCORE_RELATIONS } from './scores.constants';
import { User } from 'src/users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScoreReadyEvent } from './events/score-ready.event';
import { SCORE_READY_EVENT } from './listeners/score-ready.listener';
import { SCORE_UPDATE_EVENT } from './listeners/score-update.listener';
import { ScoreUpdateEvent } from './events/score-update.event';
import { GamesService } from 'src/games/games.service';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private scoresRepository: Repository<Score>,
    private gamesService: GamesService,
    private eventEmitter: EventEmitter2
  ) {}
  findAll() {
    return this.scoresRepository.find({
      relations: SCORE_RELATIONS,
    });
  }

  findOne(id: number) {
    return this.scoresRepository.findOne({
      relations: SCORE_RELATIONS,
      where: {
        id,
      },
    });
  }

  findScoresByGame(gameId: number) {
    return this.scoresRepository.find({
      relations: SCORE_RELATIONS,
      where: {
        game: {
          id: gameId,
        },
      },
    });
  }

  async update(scoreId: number, updateScoreDto: UpdateScoreDto, user: User) {
    let endedGame = null;
    const scoreToUpdate = this.scoresRepository.create({
      id: scoreId,
      value: updateScoreDto.score,
    });

    await this.scoresRepository.save(scoreToUpdate);

    const score = await this.findOne(scoreId);
    const updatedGame = await this.gamesService.findOne(score.gameId);

    if (updatedGame.scores.every((score) => typeof score.value === "number")) {
      endedGame = await this.gamesService.endGame(updatedGame.id);
    }

    const scoreUpdateEvent = new ScoreUpdateEvent(score.gameId);

    this.eventEmitter.emit(SCORE_UPDATE_EVENT, scoreUpdateEvent);

    return endedGame ?? updatedGame;
  }

  async setReadyState(scoreId: number, user: User) {
    let startedGame = null;
    const scoreToUpdate = this.scoresRepository.create({
      id: scoreId,
      isReady: true,
    });

    await this.scoresRepository.save(scoreToUpdate);

    const score = await this.findOne(scoreId);
    const updatedGame = await this.gamesService.findOne(score.gameId);

    if (updatedGame.scores.every((score) => score.isReady)) {
      startedGame = await this.gamesService.startGame(updatedGame.id);
    }

    const scoreReadyEvent = new ScoreReadyEvent(score.gameId);

    this.eventEmitter.emit(SCORE_READY_EVENT, scoreReadyEvent);

    return startedGame ?? updatedGame;
  }

  async joinScore(scoreId: number, user: User) {
    const score = await this.findOne(scoreId);
    const scoreToUpdate = this.scoresRepository.create({
      id: scoreId,
      members: [...score.members, user],
    });

    await this.scoresRepository.save(scoreToUpdate);

    const updatedGame = await this.gamesService.findOne(score.gameId);

    return updatedGame;
  }
}
