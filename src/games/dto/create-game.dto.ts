import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEnum, IsInt, Max, Min, Validate } from "class-validator";
import { GameType } from "src/common/enums/gameType";
import { TeamMembersNumberRule } from "../validation/team-members-number.rule";
import { TeamMembersExistsRule } from "../validation/team-members-exists.rule";
import { UniqueMembersRule } from "../validation/unique-members.rule";

export class CreateGameDto {
  @ApiProperty({ readOnly: true })
  readonly id: number;

  @ApiProperty()
  @IsEnum(GameType)
  type: GameType;

  @IsDefined()
  @Validate(TeamMembersNumberRule)
  @Validate(TeamMembersExistsRule)
  firstTeam: Array<number>;

  @IsDefined()
  @Validate(TeamMembersNumberRule)
  @Validate(TeamMembersExistsRule)
  @Validate(UniqueMembersRule)
  secondTeam: Array<number>;

  @IsDefined()
  @Min(5)
  @Max(60)
  @IsInt()
  duration: number;
}
