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

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private scoresRepository: Repository<Score>,
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
    const scoreToUpdate = this.scoresRepository.create({
      id: scoreId,
      ...updateScoreDto,
    });

    await this.scoresRepository.save(scoreToUpdate);

    const score = await this.findOne(scoreId);

    const scoreUpdateEvent = new ScoreUpdateEvent(score.gameId);

    this.eventEmitter.emit(SCORE_UPDATE_EVENT, scoreUpdateEvent);

    return score;
  }

  async setReadyState(scoreId: number, user: User) {
    const scoreToUpdate = this.scoresRepository.create({
      id: scoreId,
      isReady: true,
    });

    await this.scoresRepository.save(scoreToUpdate);

    const score = await this.findOne(scoreId);

    const scoreReadyEvent = new ScoreReadyEvent(score.gameId);

    this.eventEmitter.emit(SCORE_READY_EVENT, scoreReadyEvent);

    return score;
  }
}
