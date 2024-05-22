import { Injectable } from '@nestjs/common';
import { UpdateScoreDto } from './dto/update-score.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { Repository } from 'typeorm';
import { SCORE_RELATIONS } from './scores.constants';
import { User } from 'src/users/entities/user.entity';
import { TeamSectionsService } from 'src/teamSections/teamSections.service';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private scoresRepository: Repository<Score>,
    private teamSectionsService: TeamSectionsService
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

  async update(id: number, updateScoreDto: UpdateScoreDto, user: User) {
    await this.scoresRepository.save({
      id,
      ...updateScoreDto,
    });
  
    return this.scoresRepository.findOne({ relations: SCORE_RELATIONS, where: { id } })
  }

  async setReadyState(scoreId: number, user: User) {
    const scoreToUpdate = this.scoresRepository.create({ id: scoreId, isReady: true });

    return this.scoresRepository.save(scoreToUpdate);
  }
}
