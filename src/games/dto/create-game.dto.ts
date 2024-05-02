import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDate, IsDateString, IsDefined, IsEnum, IsInt } from "class-validator";
import { GameType } from "src/common/enums/gameType";

export class CreateGameDto {
  @ApiProperty({ readOnly: true })
  readonly id: number;

  @ApiProperty()
  @IsDateString()
  @IsDefined()
  startTime: string;

  @ApiProperty()
  @IsEnum(GameType)
  type: GameType;

  @IsDefined()
  firstSection: number;

  @IsDefined()
  secondSection: number;
}
