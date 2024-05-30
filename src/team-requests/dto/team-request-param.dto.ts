import { IsNumberString, Validate } from "class-validator";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";
import { TeamRequestExistsRule } from "../validation/team-request-exists.rule";

export class TeamRequestParamDto extends ContextAwareDto {
  @IsNumberString()
  @Validate(TeamRequestExistsRule)
  teamRequestId: string;
}