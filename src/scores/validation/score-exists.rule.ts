import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { ScoresService } from "../scores.service";

@ValidatorConstraint({ async: true, name: "ScoreExists" })
@Injectable()
export class ScoreExistsRule implements ValidatorConstraintInterface {
  constructor(private scoreService: ScoresService) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const score = await this.scoreService.findOne(+id);

    return !!score;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Score doesn't exists";
  }
}
