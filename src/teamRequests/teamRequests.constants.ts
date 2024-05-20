import { PaginateConfig } from "nestjs-paginate";
import { TeamRequest } from "./entities/team-request.entity";

export const TEAM_REQUESTS_PAGINATION_CONFIG: PaginateConfig<TeamRequest> = {
  relations: ["team", "user"],
  sortableColumns: ["id"],
  maxLimit: 20,
};
