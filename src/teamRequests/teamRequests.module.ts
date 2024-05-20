import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Team } from "src/teams/entities/team.entity";
import { User } from "src/users/entities/user.entity";
import { TeamRequest } from "./entities/team-request.entity";
import { TeamRequestsService } from "./teamRequests.service";
import { TeamRequestsController } from "./teamRequests.controller";
import { TeamExistsRule } from "src/common/validators/team-exists.rule";
import { UserExistsRule } from "src/common/validators/user-exists.rule";
import { TeamsService } from "src/teams/teams.service";
import { UsersService } from "src/users/users.service";
import { TeamSection } from "src/teamSections/entities/teamSection.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Team, User, TeamRequest, TeamSection])],
  controllers: [TeamRequestsController],
  providers: [
    TeamRequestsService,
    TeamExistsRule,
    UserExistsRule,
    TeamsService,
    UsersService,
  ],
})
export class TeamRequestsModule {}
