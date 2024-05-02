import { PaginateConfig } from "nestjs-paginate";
import { Game } from "./entities/game.entity";

export const GAME_RELATIONS = [
  "scores",
  "scores.teamSection",
  "scores.teamSection.team",
  "winner",
];

export const GAMES_PAGINATION_CONFIG: PaginateConfig<Game> = {
  relations: GAME_RELATIONS,
  sortableColumns: ["id"],
  maxLimit: 10,
};
