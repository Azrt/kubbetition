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

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  // TODO: Add user validation, prevent game with same user in different teams
  @Post()
  create(
    @Body() createGameDto: CreateGameDto,
    @CurrentUser() currentUser: User
  ) {
    return this.gamesService.create(createGameDto, currentUser);
  }

  @Get()
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Game>> {
    return this.gamesService.findAll(query);
  }

  @Get(":id")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("id") id: string) {
    return this.gamesService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateGameDto: UpdateGameDto) {
    return this.gamesService.update(+id, updateGameDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.gamesService.remove(+id);
  }

  @Patch(":id/end")
  end(@Param("id") id: string) {
    return this.gamesService.endGame(+id);
  }
}
