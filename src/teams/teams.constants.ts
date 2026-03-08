import { PaginateConfig } from "nestjs-paginate";
import { Team } from "./entities/team.entity";

export const TEAMS_PAGINATION_CONFIG: PaginateConfig<Team> = {
  sortableColumns: ["id", "name"],
  searchableColumns: ["name"],
  maxLimit: 10,
};
