import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GameType } from "src/common/enums/gameType";
import { CreateGameDto } from "../dto/create-game.dto";

@ValidatorConstraint({ async: true, name: "TeamMembersNumber" })
@Injectable()
export class TeamMembersNumberRule implements ValidatorConstraintInterface {
  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    const sectionType = (validationArguments.object as CreateGameDto)
      .type as GameType;

    return ids.length === sectionType;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Number of members must match game type";
  }
}
