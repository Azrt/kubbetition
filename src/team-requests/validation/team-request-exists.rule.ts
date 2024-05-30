import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { TeamRequestsService } from "../team-requests.service";

@ValidatorConstraint({ async: true, name: "TeamRequestExists" })
@Injectable()
export class TeamRequestExistsRule implements ValidatorConstraintInterface {
  constructor(private teamRequestsService: TeamRequestsService) {}

  async validate(id: number) {
    const teamRequest = await this.teamRequestsService.findOne(id);

    return !!teamRequest;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Team request doesn't exists";
  }
}
