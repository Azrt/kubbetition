import { User } from "src/users/entities/user.entity";
import { CreateGameDto } from "../dto/create-game.dto";
import { Game } from "../entities/game.entity";
import { PaginateQuery, Paginated } from "nestjs-paginate";

export interface GamesServiceInterface {
  create(createGameDto: CreateGameDto, currentUser: User): Promise<Game>;
  startGame(id: string): Promise<Game>;
  endGame(id: string): Promise<Game>;
  findAll(query: PaginateQuery, currentUser: User): Promise<Paginated<Game>>;
  findOne(id: string, currentUser?: User): Promise<Game>;
  cancelGame(id: string): Promise<Game>;
  findAllUserActive(user: User): Promise<Array<Game>>;
  findUserHistory(userId: string, query?: PaginateQuery): Promise<Paginated<Game>>;
  joinTeam(gameId: string, team: 1 | 2, user: User): Promise<Game>;
  leaveTeam(gameId: string, user: User): Promise<Game>;
  setTeamReady(gameId: string, team: 1 | 2, user: User): Promise<Game>;
  updateTeamScore(gameId: string, team: 1 | 2, score: number, user: User): Promise<Game>;
}
