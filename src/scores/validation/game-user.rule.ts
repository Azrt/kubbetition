import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isUserRole } from "src/common/helpers/user";
import { ScoresService } from "../scores.service";
import { TeamSectionsService } from "src/teamSections/teamSections.service";

@ValidatorConstraint({ async: true, name: "GameUser" })
@Injectable()
export class GameUserRule implements ValidatorConstraintInterface {
  constructor(
    private scoreService: ScoresService,
    private teamSectionsService: TeamSectionsService
  ) {}

  async validate(scoreId: string, validationArguments: ValidationArguments) {
    const user = (validationArguments.object as Record<string, any>)?.context
      ?.user;

    const isUser = isUserRole(user);

    if (!isUser) return true;

    const score = await this.scoreService.findOne(+scoreId);
    const teamSections = await this.teamSectionsService.findByMembers([
      user.id,
    ]);

    if (!score || !teamSections) return true

    return teamSections.some(({ team_section_id }) => team_section_id === score?.teamSectionId)
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "User cannot update this score";
  }
}
