import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { TeamRequestsService } from "../teamRequests.service";

@ValidatorConstraint({ async: true, name: "TeamRequestExists" })
@Injectable()
export class TeamRequestExistsRule implements ValidatorConstraintInterface {
  constructor(private teamRequestsService: TeamRequestsService) {}

  async validate(id: number) {
    const teamRequests = await this.teamRequestsService.findByUserId(+id);

    return !teamRequests;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "User already has team request";
  }
}
