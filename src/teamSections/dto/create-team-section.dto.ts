import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDefined, IsEnum, IsInt, Validate } from "class-validator";
import { GameType } from "src/common/enums/gameType";
import { TeamExistsRule } from "../../common/validators/team-exists.rule";
import { TeamMembersExistsRule } from "../validation/team-members-exists.rule";
import { TeamMembersNumberRule } from "../validation/team-members-number.rule";
import { UniqueMembersRule } from "../validation/unique-members.rule";
import { Team } from "src/teams/entities/team.entity";

export class CreateTeamSectionDto {
  @ApiProperty({ readOnly: true })
  readonly id: number;

  @ApiProperty()
  @IsInt()
  @IsDefined()
  @Validate(TeamExistsRule)
  team: Team;

  @ApiProperty()
  @IsEnum(GameType)
  type: GameType;

  @ApiProperty({ isArray: true })
  @IsArray()
  @IsInt({ each: true })
  @IsDefined()
  @Validate(TeamMembersNumberRule)
  @Validate(TeamMembersExistsRule)
  @Validate(UniqueMembersRule)
  members: Array<number>;
}
