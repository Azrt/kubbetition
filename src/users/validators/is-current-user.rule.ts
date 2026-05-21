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

  async validate(id: string, validationArguments: ValidationArguments) {
    const user = (validationArguments.object as Record<string, any>)?.context
      ?.user as User;

    return !!user && !!id && id === user.id;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update user's token";
  }
}
