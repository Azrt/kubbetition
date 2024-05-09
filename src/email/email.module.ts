import { Module } from "@nestjs/common";
import EmailService from "./email.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailConfirmationService } from "./emailConfirmation.service";
import { JwtService } from "@nestjs/jwt";
import { EmailConfirmationController } from "./emailConfirmation.controller";
import { UsersService } from "src/users/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { TeamsService } from "src/teams/teams.service";
import { Team } from "src/teams/entities/team.entity";
import { TeamSection } from "src/teamSections/entities/teamSection.entity";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, Team, TeamSection])],
  controllers: [EmailConfirmationController],
  providers: [
    EmailService,
    EmailConfirmationService,
    JwtService,
    UsersService,
    ConfigService,
    TeamsService,
    TeamSection,
  ],
})
export class EmailModule {}
