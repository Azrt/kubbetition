import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GamesService } from "src/games/games.service";
import { ScoresService } from "../scores.service";

@ValidatorConstraint({ async: true, name: "GameNotCancelled" })
@Injectable()
export class GameNotCancelledRule implements ValidatorConstraintInterface {
  constructor(
    private gamesService: GamesService,
    private scoreService: ScoresService
  ) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const score = await this.scoreService.findOne(+id);
    const game = await this.gamesService.findOne(score?.gameId);

    return !game.isCancelled;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Cannot update cancelled game";
  }
}
