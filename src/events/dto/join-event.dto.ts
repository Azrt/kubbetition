import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class JoinEventDto {
  @ApiProperty({
    description: 'Team to add to event (array of user IDs). Length must match event.gameType (team size).',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  team: number[];
}

