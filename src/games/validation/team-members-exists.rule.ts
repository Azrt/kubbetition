import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UsersService } from "src/users/users.service";

@ValidatorConstraint({ async: true, name: "TeamMembersExist" })
@Injectable()
export class TeamMembersExistsRule implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    if (!ids?.length) return false;

    const members = await this.usersService.findByIds(ids);
    
    return members.length === ids.length;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Members doesn't exists";
  }
}
