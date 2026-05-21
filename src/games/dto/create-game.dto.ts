import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsDefined, IsEnum, IsInt, IsOptional, IsUUID, Max, Min, Validate, ValidateIf } from "class-validator";
import { GameType } from "src/common/enums/gameType";
import { UsersExistRule } from "../validation/users-exist.rule";
import { ParticipantsAreFriendsOrTeamMembersRule } from "../validation/participants-are-friends-or-team-members.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class CreateGameDto extends ContextAwareDto {
  @ApiProperty({ description: 'Game type determining team size (1v1, 2v2, 3v3, 4v4, 6v6)' })
  @IsEnum(GameType)
  type: GameType;

  @ApiProperty({ description: 'Optional list of user IDs to invite/notify about the game. Ignored when team1DivisionId and team2DivisionId are provided.' })
  @ValidateIf((o) => !o.team1DivisionId && !o.team2DivisionId)
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Validate(UsersExistRule)
  @Validate(ParticipantsAreFriendsOrTeamMembersRule)
  participants?: Array<string>;

  @ApiProperty({ description: 'When true, randomly assign participants to team1 and team2 (default: false). Ignored when using divisions.', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  randomize?: boolean;

  @ApiProperty({
    description: 'Division ID for team 1. Must be used together with team2DivisionId. Division type must match game type.',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  team1DivisionId?: string;

  @ApiProperty({
    description: 'Division ID for team 2. Must be used together with team1DivisionId. Division type must match game type.',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  team2DivisionId?: string;

  @ApiProperty({ description: 'Game duration in minutes (5-60)' })
  @IsDefined()
  @Min(5)
  @Max(60)
  @IsInt()
  duration: number;
}
