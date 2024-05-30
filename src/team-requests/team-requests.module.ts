import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Team } from "src/teams/entities/team.entity";
import { User } from "src/users/entities/user.entity";
import { TeamRequest } from "./entities/team-request.entity";
import { TeamRequestsService } from "./team-requests.service";
import { TeamRequestsController } from "./team-requests.controller";
import { TeamExistsRule } from "src/common/validators/team-exists.rule";
import { UserExistsRule } from "src/common/validators/user-exists.rule";
import { TeamsService } from "src/teams/teams.service";
import { UsersService } from "src/users/users.service";
import { UserTeamRequestExistsRule } from "./validation/user-team-request-exists.rule";
import { TeamRequestExistsRule } from "./validation/team-request-exists.rule";

@Module({
  imports: [TypeOrmModule.forFeature([Team, User, TeamRequest])],
  controllers: [TeamRequestsController],
  providers: [
    TeamRequestsService,
    TeamExistsRule,
    UserExistsRule,
    UserTeamRequestExistsRule,
    TeamRequestExistsRule,
    TeamsService,
    UsersService,
  ],
})
export class TeamRequestsModule {}
