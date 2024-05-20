import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Validate } from "class-validator";
import { TeamExistsRule } from "src/common/validators/team-exists.rule";
import { UserExistsRule } from "src/common/validators/user-exists.rule";

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
  user: number;
}
