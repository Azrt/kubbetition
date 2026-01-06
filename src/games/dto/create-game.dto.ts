import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDefined, IsEnum, IsInt, IsOptional, Max, Min, Validate } from "class-validator";
import { GameType } from "src/common/enums/gameType";
import { UsersExistRule } from "../validation/users-exist.rule";

export class CreateGameDto {
  @ApiProperty({ readOnly: true })
  readonly id: number;

  @ApiProperty({ description: 'Game type determining team size (1v1, 2v2, 3v3, 6v6)' })
  @IsEnum(GameType)
  type: GameType;

  @ApiProperty({ description: 'Optional list of user IDs to invite/notify about the game' })
  @IsOptional()
  @IsArray()
  @Validate(UsersExistRule)
  participants?: Array<number>;

  @ApiProperty({ description: 'Game duration in minutes (5-60)' })
  @IsDefined()
  @Min(5)
  @Max(60)
  @IsInt()
  duration: number;
}
