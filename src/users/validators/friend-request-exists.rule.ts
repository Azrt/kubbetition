import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UsersService } from "../users.service";

@ValidatorConstraint({ async: true, name: "FriendRequestExists" })
@Injectable()
export class FriendRequestExistsRule implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(id: string) {
    const friendRequest = await this.usersService.findFriendRequest(id);

    return !!friendRequest;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Friend request doesn't exist";
  }
}
