import { PaginateConfig } from "nestjs-paginate";
import { TeamSection } from "./entities/teamSection.entity";

export const TEAM_SECTIONS_PAGINATION_CONFIG: PaginateConfig<TeamSection> = {
  relations: ["team", "members"],
  sortableColumns: ["id", "type"],
  maxLimit: 10,
};