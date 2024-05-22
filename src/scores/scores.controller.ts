import { Controller, Get, Body, Patch, Param, UseInterceptors, Post } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { UpdateScoreDto } from './dto/update-score.dto';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { UpdateScoreParamsDto } from "./dto/update-score-params.dto";
import { ScoreReadyParamsDto } from "./dto/score-ready-params.dto";
import { ParamContextInterceptor } from 'src/common/interceptors/param-context-interceptor';

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
  @UseInterceptors(NotFoundInterceptor, ParamContextInterceptor)
  update(
    @Param() params: UpdateScoreParamsDto,
    @Body() updateScoreDto: UpdateScoreDto,
    @CurrentUser() user: User
  ) {
    return this.scoresService.update(+params.scoreId, updateScoreDto, user);
  }

  @Post(":scoreId/ready")
  @UseInterceptors(NotFoundInterceptor, ParamContextInterceptor)
  setReadyState(
    @Param() params: ScoreReadyParamsDto,
    @CurrentUser() user: User
  ) {
    return this.scoresService.setReadyState(+params.scoreId, user);
  }
}
