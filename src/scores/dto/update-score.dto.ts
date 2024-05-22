import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateScoreDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;
}
