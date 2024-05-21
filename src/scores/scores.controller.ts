import { Controller, Get, Body, Patch, Param, UseInterceptors, Post } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { UpdateScoreDto } from './dto/update-score.dto';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { GameInProgressPipe } from './pipes/game-in-progress.pipe';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GameNotReadysPipe } from './pipes/game-not-ready.pipe';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("scores")
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  findAll() {
    return this.scoresService.findAll();
  }

  @Get(":scoreId")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("scoreId") scoreId: string) {
    return this.scoresService.findOne(+scoreId);
  }

  @Get("/game/:id")
  @UseInterceptors(NotFoundInterceptor)
  findByGame(@Param("id") id: string) {
    return this.scoresService.findScoresByGame(+id);
  }

  @Patch(":scoreId")
  @UseInterceptors(NotFoundInterceptor)
  update(
    @Param("scoreId", GameInProgressPipe, GameNotReadysPipe) scoreId: string,
    @Body() updateScoreDto: UpdateScoreDto
  ) {
    return this.scoresService.update(+scoreId, updateScoreDto);
  }

  @Post(":scoreId/ready")
  setReadyState(@Param("scoreId", GameInProgressPipe) scoreId: string) {
    this.scoresService.setReadyState(+scoreId);
  }
}
