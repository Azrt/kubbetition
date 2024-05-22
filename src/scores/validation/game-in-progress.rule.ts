import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GamesService } from "src/games/games.service";

@ValidatorConstraint({ async: true, name: "GameInProgress" })
@Injectable()
export class GameInProgressRule implements ValidatorConstraintInterface {
  constructor(private gamesService: GamesService) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const game = await this.gamesService.findOneByScore(+id);

    return !game?.endTime
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update finished game";
  }
}
