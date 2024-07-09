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
import { JoinScoreParams } from './dto/join-score-params.dto';
import { GamesGateway } from 'src/games/games.gateway';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("scores")
export class ScoresController {
  constructor(
    private readonly scoresService: ScoresService,
    private readonly gamesGateway: GamesGateway,
  ) {}

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
  async update(
    @Param() params: UpdateScoreParamsDto,
    @Body() updateScoreDto: UpdateScoreDto,
    @CurrentUser() user: User
  ) {
    const game = await this.scoresService.update(
      +params.scoreId,
      updateScoreDto,
      user
    );

    await this.gamesGateway.emitGameUpdate(game);
  
    return game;
  }

  @Post(":scoreId/ready")
  @UseInterceptors(NotFoundInterceptor, ParamContextInterceptor)
  setReadyState(
    @Param() params: ScoreReadyParamsDto,
    @CurrentUser() user: User
  ) {
    return this.scoresService.setReadyState(+params.scoreId, user);
  }

  @Post(":scoreId/join")
  @UseInterceptors(NotFoundInterceptor, ParamContextInterceptor)
  joinScore(@Param() params: JoinScoreParams, @CurrentUser() user: User) {
    return this.scoresService.joinScore(+params.scoreId, user);
  }
}
