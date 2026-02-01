import { PaginateConfig } from "nestjs-paginate";
import { Team } from "./entities/team.entity";

export const TEAMS_PAGINATION_CONFIG: PaginateConfig<Team> = {
  relations: ["members"],
  sortableColumns: ["id", "name"],
  searchableColumns: ["name"],
  maxLimit: 10,
};
