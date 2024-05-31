import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEnum, IsInt, IsOptional, Max, Min, Validate } from "class-validator";
import { GameType } from "src/common/enums/gameType";
import { TeamMembersNumberRule } from "../validation/team-members-number.rule";
import { TeamMembersExistsRule } from "../validation/team-members-exists.rule";
import { UniqueMembersRule } from "../validation/unique-members.rule";
import { GameParticipantsNumberRule } from "../validation/game-participants-number.rule";

export class CreateGameDto {
  @ApiProperty({ readOnly: true })
  readonly id: number;

  @ApiProperty()
  @IsEnum(GameType)
  type: GameType;

  @IsOptional()
  @Validate(TeamMembersNumberRule)
  @Validate(TeamMembersExistsRule)
  firstTeam?: Array<number>;

  @IsOptional()
  @Validate(TeamMembersNumberRule)
  @Validate(TeamMembersExistsRule)
  @Validate(UniqueMembersRule)
  secondTeam?: Array<number>;

  @IsDefined()
  @Validate(TeamMembersExistsRule)
  @Validate(GameParticipantsNumberRule)
  participants: Array<number>;

  @IsDefined()
  @Min(5)
  @Max(60)
  @IsInt()
  duration: number;
}
