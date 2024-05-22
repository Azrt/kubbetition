import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Validate } from "class-validator";
import { TeamExistsRule } from "src/common/validators/team-exists.rule";
import { UserExistsRule } from "src/common/validators/user-exists.rule";
import { UserTeamRequestExistsRule } from "../validators/user-team-request-exists.rule";

export class CreateTeamRequestDto {
  @ApiProperty()
  @IsInt()
  @Validate(TeamExistsRule)
  team: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  message: string;

  @IsInt()
  @IsOptional()
  @Validate(UserExistsRule)
  @Validate(UserTeamRequestExistsRule)
  user: number;
}
