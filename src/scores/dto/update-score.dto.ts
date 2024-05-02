import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateScoreDto } from './create-score.dto';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateScoreDto extends PartialType(CreateScoreDto) {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;
}
