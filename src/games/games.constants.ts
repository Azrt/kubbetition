import { PaginateConfig } from "nestjs-paginate";
import { Game } from "./entities/game.entity";

export const GAME_RELATIONS = [
  "createdBy",
  "participants",
  "team1Members",
  "team1Members.team",
  "team2Members",
  "team2Members.team",
  "event",
];

export const GAMES_PAGINATION_CONFIG: PaginateConfig<Game> = {
  relations: GAME_RELATIONS,
  sortableColumns: ["id"],
  maxLimit: 10,
};
