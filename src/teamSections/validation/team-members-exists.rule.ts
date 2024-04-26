import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UsersService } from "src/users/users.service";
import { CreateTeamSectionDto } from "../dto/create-team-section.dto";

@ValidatorConstraint({ async: true, name: "TeamMembersExist" })
@Injectable()
export class TeamMembersExistsRule implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    // TODO: Change "object" type when generics are available
    const teamId = (validationArguments.object as CreateTeamSectionDto)
      .team as unknown as number;

    const members = await this.usersService.findByIds(ids, teamId);

    if (!members.length || members.length !== ids.length) {
      return false;
    }

    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Members doesn't exists";
  }
}
