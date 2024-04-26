import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { TeamSectionsService } from "../teamSections.service";

@ValidatorConstraint({ async: true, name: "UniqueMembers" })
@Injectable()
export class UniqueMembersRule implements ValidatorConstraintInterface {
  constructor(private teamSectionsService: TeamSectionsService) {}

  async validate(ids: Array<number>, validationArguments: ValidationArguments) {
    const sections = await this.teamSectionsService.findByMembers(ids, ids.length);

    return !sections;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Team members cannot repeat";
  }
}
