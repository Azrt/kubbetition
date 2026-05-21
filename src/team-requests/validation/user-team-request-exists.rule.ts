import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { TeamRequestsService } from "../team-requests.service";

@ValidatorConstraint({ async: true, name: "UserTeamRequestExists" })
@Injectable()
export class UserTeamRequestExistsRule implements ValidatorConstraintInterface {
  constructor(private teamRequestsService: TeamRequestsService) {}

  async validate(id: string) {
    const teamRequests = await this.teamRequestsService.findByUserId(id);

    return !teamRequests.length;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Team request doesn`t exists";
  }
}
