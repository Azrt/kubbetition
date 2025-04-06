import { User } from "src/users/entities/user.entity";
import { CreateGameDto } from "../dto/create-game.dto";
import { Game } from "../entities/game.entity";
import { PaginateQuery, Paginated } from "nestjs-paginate";

export interface GamesServiceInterface {
  create(createGameDto: CreateGameDto, currentUser: User): Promise<Game>;
  startGame(id: number): Promise<Game>;
  endGame(id: number): Promise<Game>;
  findAll(query?: PaginateQuery): Promise<Paginated<Game>>;
  findOne(id: number): Promise<Game>;
  findOneByScore(scoreId: number): Promise<Game>;
  cancelGame(id: number): Promise<Game>;
  findAllUserActive(user: User): Promise<Array<Game>>;
}