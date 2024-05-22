import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsDefined, IsEnum, IsInt, Max, Min } from "class-validator";
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

  @IsDefined()
  @Min(5)
  @Max(60)
  @IsInt()
  duration: number;
}
