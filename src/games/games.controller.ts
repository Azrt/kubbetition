import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Game } from './entities/game.entity';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { User } from 'src/users/entities/user.entity';
import { CancelGameDto } from './dto/cancel-game.dto';
import { EndGameDto } from './dto/end-game.dto';
import { ParamContextInterceptor } from 'src/common/interceptors/param-context-interceptor';
import { GamesGateway } from './games.gateway';
import { NotificationsService } from 'src/common/services/notifications.service';
import { UsersService } from 'src/users/users.service';
import { JoinTeamParamsDto } from './dto/join-team.dto';
import { TeamReadyParamsDto } from './dto/team-ready.dto';
import { UpdateTeamScoreParamsDto, UpdateTeamScoreBodyDto } from './dto/update-team-score.dto';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("games")
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gamesGateway: GamesGateway,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(
    @Body() createGameDto: CreateGameDto,
    @CurrentUser() currentUser: User,
  ) {
    const game = await this.gamesService.create(createGameDto, currentUser);
  
    // Notify invited participants if any
    if (createGameDto.participants?.length) {
      const tokens = await this.usersService.getMobileTokens(createGameDto.participants);
      const tokensArray = tokens.map(({ token }) => token).filter(Boolean);

      if (tokensArray.length) {
        const title = 'New game has been created!';
        const body = `${game.createdBy.firstName} ${game.createdBy.lastName} started a new game`;
        await this.notificationsService.sendToUsers(tokensArray, title, body);
      }
    }

    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }

  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Game>> {
    return this.gamesService.findAll(query);
  }

  @Get("active")
  findUserActive(@CurrentUser() currentUser: User) {
    return this.gamesService.findAllUserActive(currentUser);
  }

  @Get(":gameId")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("gameId") gameId: string) {
    return this.gamesService.findOne(+gameId);
  }

  @Patch(":gameId")
  async update(
    @Param("gameId") gameId: string,
    @Body() updateGameDto: UpdateGameDto
  ) {
    const game = await this.gamesService.update(+gameId, updateGameDto);
  
    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }

  @Delete(":gameId")
  remove(@Param("gameId") gameId: string) {
    return this.gamesService.remove(+gameId);
  }

  @Patch(":gameId/end")
  async end(@Param() params: EndGameDto) {
    const game = await this.gamesService.endGame(+params.gameId);
    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }

  @UseInterceptors(ParamContextInterceptor)
  @Post(":gameId/cancel")
  async cancel(@Param() params: CancelGameDto) {
    const game = await this.gamesService.cancelGame(+params.gameId);

    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }

  // Team operations
  @UseInterceptors(ParamContextInterceptor)
  @Post(":gameId/team/:team/join")
  async joinTeam(
    @Param() params: JoinTeamParamsDto,
    @CurrentUser() user: User
  ) {
    const game = await this.gamesService.joinTeam(
      +params.gameId,
      +params.team as 1 | 2,
      user
    );

    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }

  @UseInterceptors(ParamContextInterceptor)
  @Post(":gameId/leave")
  async leaveTeam(
    @Param("gameId") gameId: string,
    @CurrentUser() user: User
  ) {
    const game = await this.gamesService.leaveTeam(+gameId, user);

    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }

  @UseInterceptors(ParamContextInterceptor)
  @Post(":gameId/team/:team/ready")
  async setTeamReady(
    @Param() params: TeamReadyParamsDto,
    @CurrentUser() user: User
  ) {
    const game = await this.gamesService.setTeamReady(
      +params.gameId,
      +params.team as 1 | 2,
      user
    );

    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }

  @UseInterceptors(ParamContextInterceptor, NotFoundInterceptor)
  @Patch(":gameId/team/:team/score")
  async updateTeamScore(
    @Param() params: UpdateTeamScoreParamsDto,
    @Body() body: UpdateTeamScoreBodyDto,
    @CurrentUser() user: User
  ) {
    const game = await this.gamesService.updateTeamScore(
      +params.gameId,
      +params.team as 1 | 2,
      body.score,
      user
    );

    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }
}
