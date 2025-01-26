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
import { ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("games")
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gamesGateway: GamesGateway
  ) {}

  @Post()
  async create(
    @Body() createGameDto: CreateGameDto,
    @CurrentUser() currentUser: User,
    @ConnectedSocket() socket: Socket
  ) {
    const game = await this.gamesService.create(createGameDto, currentUser);

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

    return game
  }

  @UseInterceptors(ParamContextInterceptor)
  @Post(":gameId/cancel")
  async cancel(@Param() params: CancelGameDto) {
    const game = await this.gamesService.cancelGame(+params.gameId);

    await this.gamesGateway.sendGameDataToClients(game);

    return game;
  }
}
