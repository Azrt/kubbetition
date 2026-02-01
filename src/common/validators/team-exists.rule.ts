import { Injectable } from "@nestjs/common";
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { TeamsService } from "src/teams/teams.service";

@ValidatorConstraint({ async: true, name: 'TeamExists' })
@Injectable()
export class TeamExistsRule implements ValidatorConstraintInterface {
  constructor(
    private teamsService: TeamsService
  ) {}

  async validate(id: string) {
    if (!id) return false
  
    const team = await this.teamsService.findOne(id);

    return !!team;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Team doesn't exist";
  }
}