import { Module } from "@nestjs/common";
import EmailService from "./email.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailConfirmationService } from "./emailConfirmation.service";
import { JwtService } from "@nestjs/jwt";
import { EmailConfirmationController } from "./emailConfirmation.controller";
import { UsersService } from "src/users/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { FriendRequest } from "src/users/entities/friend-request.entity";
import { TeamsService } from "src/teams/teams.service";
import { Team } from "src/teams/entities/team.entity";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, Team, FriendRequest])],
  controllers: [EmailConfirmationController],
  providers: [
    EmailService,
    EmailConfirmationService,
    JwtService,
    UsersService,
    ConfigService,
    TeamsService,
  ],
})
export class EmailModule {}
