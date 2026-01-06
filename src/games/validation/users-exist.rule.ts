import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UsersService } from "src/users/users.service";

@ValidatorConstraint({ async: true, name: "UsersExist" })
@Injectable()
export class UsersExistRule implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    if (!ids?.length) return true; // Empty array is valid (optional field)

    const users = await this.usersService.findByIds(ids);
    
    return users.length === ids.length;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "One or more users do not exist";
  }
}

