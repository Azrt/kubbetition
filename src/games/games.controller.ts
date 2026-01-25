import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Game } from './entities/game.entity';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { BodyContextInterceptor } from 'src/common/interceptors/body-context.interceptor';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
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
import { FileUploadService, FileType } from 'src/common/services/file-upload.service';
import { isAdminRole } from 'src/common/helpers/user';

@ApiTags('games')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("games")
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gamesGateway: GamesGateway,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(BodyContextInterceptor)
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
    @CurrentUser() currentUser: User,
  ): Promise<Paginated<Game>> {
    return this.gamesService.findAll(query, currentUser);
  }

  @Get("active")
  findUserActive(@CurrentUser() currentUser: User) {
    return this.gamesService.findAllUserActive(currentUser);
  }

  @Get("history")
  findCurrentUserHistory(
    @CurrentUser() currentUser: User,
    @Paginate() query: PaginateQuery
  ): Promise<Paginated<Game>> {
    return this.gamesService.findUserHistory(currentUser.id, query);
  }

  @Get("history/:userId")
  findUserHistory(
    @Param("userId") userId: string,
    @Paginate() query: PaginateQuery
  ): Promise<Paginated<Game>> {
    return this.gamesService.findUserHistory(+userId, query);
  }

  @Get(":gameId")
  @UseInterceptors(NotFoundInterceptor)
  findOne(
    @Param("gameId") gameId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.gamesService.findOne(+gameId, currentUser);
  }

  @Patch(":gameId")
  @UseInterceptors(BodyContextInterceptor)
  async update(
    @Param("gameId") gameId: string,
    @Body() updateGameDto: UpdateGameDto,
    @CurrentUser() currentUser: User
  ) {
    const game = await this.gamesService.update(+gameId, updateGameDto, currentUser);
  
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
  @ApiParam({
    name: 'gameId',
    type: 'integer',
  })
  @ApiParam({
    name: 'team',
    type: 'integer',
  })
  @Post(":gameId/team/:team/join")
  async joinTeam(
    @Param() params: JoinTeamParamsDto,
    @CurrentUser() user: User
  ) {
    console.log('Team joining - Raw params:', params);
    console.log('Team joining - gameId (raw):', params.gameId, 'gameId (converted):', +params.gameId);
    console.log('Team joining - team (raw):', params.team, 'team (converted):', +params.team, 'team (as 1|2):', +params.team as 1 | 2);
    console.log('Team joining - user:', user.id, user.email);

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
  @ApiParam({
    name: 'gameId',
    type: 'integer',
  })
  @ApiParam({
    name: 'team',
    type: 'integer',
  })
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
  @ApiParam({
    name: 'gameId',
    type: 'integer',
  })
  @ApiParam({
    name: 'team',
    type: 'integer',
  })
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

  @Post(":gameId/social-photo")
  @UseInterceptors(FileInterceptor("file"))
  @UseInterceptors(ParamContextInterceptor, NotFoundInterceptor)
  async uploadSocialPhoto(
    @Param("gameId") gameId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const game = await this.gamesService.findOne(+gameId, user);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Check if user is a participant in the game
    const isParticipant = game.participants?.some((p) => p.id === user.id) ||
      game.team1Members?.some((m) => m.id === user.id) ||
      game.team2Members?.some((m) => m.id === user.id);

    if (!isParticipant && !isAdminRole(user)) {
      throw new ForbiddenException('Only game participants can upload social photos');
    }

    const photoUrl = await this.fileUploadService.uploadFile(file, FileType.GAME_PHOTO, {
      resize: { width: 1200 },
      format: 'jpeg',
    });

    // Delete old photo if exists
    if (game.socialPhoto) {
      await this.fileUploadService.deleteFile(game.socialPhoto, FileType.GAME_PHOTO);
    }

    const updatedGame = await this.gamesService.updateSocialPhoto(+gameId, photoUrl);
    await this.gamesGateway.sendGameDataToClients(updatedGame);

    return updatedGame;
  }
}
