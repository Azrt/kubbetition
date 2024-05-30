import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { CreateGameDto } from "../dto/create-game.dto";

@ValidatorConstraint({ async: true, name: "UniqueMembers" })
@Injectable()
export class UniqueMembersRule implements ValidatorConstraintInterface {
  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    const firstTeam = (validationArguments.object as CreateGameDto)
      .firstTeam;

    if (!Array.isArray(ids) || !Array.isArray(firstTeam)) return false;
  
    return firstTeam.every((id) =>
      ids.every((currentId) => currentId !== id)
    );
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Team members cannot repeat";
  }
}
