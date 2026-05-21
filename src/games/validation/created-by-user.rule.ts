import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { User } from "src/users/entities/user.entity";
import { GamesService } from "../games.service";

@ValidatorConstraint({ async: true, name: "CreatedByUser" })
@Injectable()
export class CreatedByUserRule implements ValidatorConstraintInterface {
  constructor(private gameService: GamesService) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const user = (validationArguments.object as Record<string, any>)?.context
      ?.user as User;

    const game = await this.gameService.findOne(id);

    return game?.createdBy?.id === user?.id;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update if user is not a creator";
  }
}
