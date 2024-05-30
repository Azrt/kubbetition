import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isAdminRole, isUserRole } from "src/common/helpers/user";
import { ScoresService } from "../scores.service";

@ValidatorConstraint({ async: true, name: "GameUser" })
@Injectable()
export class GameUserRule implements ValidatorConstraintInterface {
  constructor(
    private scoreService: ScoresService
  ) {}

  async validate(scoreId: string, validationArguments: ValidationArguments) {
    const user = (validationArguments.object as Record<string, any>)?.context
      ?.user;

    const isAdmin = isAdminRole(user);

    if (isAdmin) return true;

    const score = await this.scoreService.findOne(+scoreId);
    // const teamSections = await this.teamSectionsService.findByMembers([
    //   user.id,
    // ]);

    if (!score) return true;

    // if (!score || !teamSections) return true

    // return teamSections.some(({ team_section_id }) => team_section_id === score?.teamSectionId)
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "User cannot update this score";
  }
}
