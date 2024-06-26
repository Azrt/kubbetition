import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { User } from "../entities/user.entity";

@ValidatorConstraint({ async: true, name: "IsCurrentUser" })
@Injectable()
export class IsCurrentUserRule implements ValidatorConstraintInterface {
  constructor() {}

  async validate(id: number, validationArguments: ValidationArguments) {
    const user = (validationArguments.object as Record<string, any>)?.context
      ?.user as User;

    return !!user && !!id && Number(id) === user.id;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update user's token";
  }
}
