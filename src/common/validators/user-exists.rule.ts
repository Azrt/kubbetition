import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UsersService } from "src/users/users.service";

@ValidatorConstraint({ async: true, name: "UserExists" })
@Injectable()
export class UserExistsRule implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(id: number) {
    if (!id) return false;

    const user = await this.usersService.findOne(+id);

    return !!user;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "User doesn't exist";
  }
}
