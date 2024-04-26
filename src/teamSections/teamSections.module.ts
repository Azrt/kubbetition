import { Module } from "@nestjs/common";
import { TeamSectionsService } from "./teamSections.service";
import { TeamSectionsController } from "./teamSections.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TeamSection } from "./entities/teamSection.entity";
import { UsersService } from "src/users/users.service";
import { User } from "src/users/entities/user.entity";
import { Team } from "src/teams/entities/team.entity";
import { TeamsService } from "src/teams/teams.service";
import { TeamExistsRule } from "../common/validators/team-exists.rule";
import { TeamMembersExistsRule } from "./validation/team-members-exists.rule";
import { TeamMembersNumberRule } from "./validation/team-members-number.rule";
import { UniqueMembersRule } from "./validation/unique-members.rule";
import { TeamSectionMembers } from "./entities/teamSectionMembers.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TeamSection, User, Team, TeamSectionMembers])],
  controllers: [TeamSectionsController],
  providers: [
    TeamSectionsService,
    UsersService,
    TeamsService,
    TeamExistsRule,
    TeamMembersExistsRule,
    TeamMembersNumberRule,
    UniqueMembersRule,
  ],
})
export class TeamSectionsModule {}
