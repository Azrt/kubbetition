import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GamesService } from "src/games/games.service";
import { ScoresService } from "../scores.service";

@ValidatorConstraint({ async: true, name: "GameScoreReady" })
@Injectable()
export class GameScoreReadyRule implements ValidatorConstraintInterface {
  constructor(
    private gamesService: GamesService,
    private scoreService: ScoresService
  ) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const score = await this.scoreService.findOne(+id);
    const game = await this.gamesService.findOne(score?.gameId);

    if (!score) return true;

    return game.isGameReady;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update score if game is not ready yet";
  }
}
