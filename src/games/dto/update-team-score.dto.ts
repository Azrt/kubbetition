import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumberString, Max, Min } from 'class-validator';
import { ContextAwareDto } from 'src/common/dto/context-aware.dto';

export class UpdateTeamScoreParamsDto extends ContextAwareDto {
  @IsNumberString()
  gameId: string;

  @IsIn(['1', '2'])
  team: '1' | '2';
}

export class UpdateTeamScoreBodyDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;
}







