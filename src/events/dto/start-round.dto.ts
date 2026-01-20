import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class StartRoundDto {
  @ApiProperty({
    description: 'Round number to start (1-indexed)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  roundNumber: number;
}
