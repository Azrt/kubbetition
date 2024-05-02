import { Injectable, UseInterceptors } from '@nestjs/common';
import { UpdateScoreDto } from './dto/update-score.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { Repository } from 'typeorm';
import { SCORE_RELATIONS } from './scores.constants';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private scoresRepository: Repository<Score>
  ) {}
  findAll() {
    return this.scoresRepository.find({
      relations: SCORE_RELATIONS,
    });
  }

  findOne(id: number) {
    return this.scoresRepository.find({
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

  async update(id: number, updateScoreDto: UpdateScoreDto) {
    await this.scoresRepository.save({
      id,
      ...updateScoreDto,
    });
  
    return this.scoresRepository.findOne({ relations: SCORE_RELATIONS, where: { id } })
  }
}
