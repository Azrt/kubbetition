import { PaginateConfig } from "nestjs-paginate";
import { Game } from "./entities/game.entity";

export const GAME_RELATIONS = [
  "createdBy",
  "scores",
  "scores.members",
  "scores.members.team",
];

export const GAMES_PAGINATION_CONFIG: PaginateConfig<Game> = {
  relations: GAME_RELATIONS,
  sortableColumns: ["id"],
  maxLimit: 10,
};
