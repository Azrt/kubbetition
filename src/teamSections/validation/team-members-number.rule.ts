import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UsersService } from "src/users/users.service";
import { CreateTeamSectionDto } from "../dto/create-team-section.dto";
import { GameType } from "src/common/enums/gameType";

@ValidatorConstraint({ async: true, name: "TeamMembersNumber" })
@Injectable()
export class TeamMembersNumberRule implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    const members = await this.usersService.findByIds(ids);
    // TODO: Change "object" type when generics are available
    const sectionType = (validationArguments.object as CreateTeamSectionDto)
      .type as GameType;

    // Prevent saving team section with less than 2 users
    return members.length > 1 && members.length === sectionType;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Number of members must match game type";
  }
}
