import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GamesService } from "src/games/games.service";
import { ScoresService } from "../scores.service";

@ValidatorConstraint({ async: true, name: "GameReady" })
@Injectable()
export class GameReadyRule implements ValidatorConstraintInterface {
  constructor(
    private gamesService: GamesService,
    private scoreService: ScoresService
  ) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const score = await this.scoreService.findOne(+id);
    const game = await this.gamesService.findOne(score?.gameId);

    return game.scores.every(({ isReady }) => isReady);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update score if game is not ready yet";
  }
}
