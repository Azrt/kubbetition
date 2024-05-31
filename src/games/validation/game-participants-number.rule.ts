import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GameType } from "src/common/enums/gameType";
import { CreateGameDto } from "../dto/create-game.dto";

@ValidatorConstraint({ async: true, name: "GameParticipantsNumber" })
@Injectable()
export class GameParticipantsNumberRule implements ValidatorConstraintInterface {
  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    const sectionType = (validationArguments.object as CreateGameDto)
      .type as GameType;

    return ids?.length === (sectionType * 2);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Number of game participants must match game type";
  }
}
