import { Controller, Get, Body, Patch, Param, UseInterceptors } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { UpdateScoreDto } from './dto/update-score.dto';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found-interceptor';
import { ScoreUpdateInterceptor } from './interceptors/score-update-interceptor';
import { GameInProgressPipe } from './pipes/game-in-progress.pipe';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("scores")
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  findAll() {
    return this.scoresService.findAll();
  }

  @Get(":id")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("id") id: string) {
    return this.scoresService.findOne(+id);
  }

  @Get("/game/:id")
  @UseInterceptors(NotFoundInterceptor)
  findByGame(@Param("id") id: string) {
    return this.scoresService.findScoresByGame(+id);
  }

  @Patch(":id")
  @UseInterceptors(ScoreUpdateInterceptor)
  update(
    @Param("id", GameInProgressPipe) id: string,
    @Body() updateScoreDto: UpdateScoreDto
  ) {
    return this.scoresService.update(+id, updateScoreDto);
  }
}
