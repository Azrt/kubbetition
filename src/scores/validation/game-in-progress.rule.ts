import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isAdminRole, isUserRole } from "src/common/helpers/user";
import { GamesService } from "src/games/games.service";

@ValidatorConstraint({ async: true, name: "GameInProgress" })
@Injectable()
export class GameInProgressRule implements ValidatorConstraintInterface {
  constructor(private gamesService: GamesService) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const user = (validationArguments.object as Record<string, any>)
      ?.context?.user;

    const isAdmin = isAdminRole(user);

    if (isAdmin) return true;

    const game = await this.gamesService.findOneByScore(+id);

    return !game?.endTime
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update finished game";
  }
}
