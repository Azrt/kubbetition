import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GamesService } from "src/games/games.service";

@ValidatorConstraint({ async: true, name: "GameReady" })
@Injectable()
export class GameReadyRule implements ValidatorConstraintInterface {
  constructor(
    private gamesService: GamesService
  ) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const game = await this.gamesService.findOne(+id);

    return game.isGameReady;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Game is not ready";
  }
}
