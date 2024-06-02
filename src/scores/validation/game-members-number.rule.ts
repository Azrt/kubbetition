import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GamesService } from "src/games/games.service";
import { ScoresService } from "../scores.service";

@ValidatorConstraint({ async: true, name: "GameMembersNumber" })
@Injectable()
export class GameMembersNumberRule implements ValidatorConstraintInterface {
  constructor(
    private scoreService: ScoresService
  ) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const score = await this.scoreService.findOne(+id);

    if (!score) return true;

    return score.members.length === score.game.type;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Number of score members doesn't match game type";
  }
}
