import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsOptional, IsString, Validate } from "class-validator";
import { TeamExistsRule } from "src/common/validators/team-exists.rule";
import { UserExistsRule } from "src/common/validators/user-exists.rule";
import { UserTeamRequestExistsRule } from "../validation/user-team-request-exists.rule";

export class CreateTeamRequestDto {
  @ApiProperty()
  @IsUUID()
  @Validate(TeamExistsRule)
  team: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  message: string;

  @IsUUID()
  @IsOptional()
  @Validate(UserExistsRule)
  @Validate(UserTeamRequestExistsRule)
  user: string;
}
