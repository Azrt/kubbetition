import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID, ArrayNotEmpty, ValidateIf } from 'class-validator';

export class JoinEventDto {
  @ApiProperty({
    description:
      'Team to add to event (array of user IDs). Length must match event.gameType. Use either team or divisionId, not both.',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    type: [String],
    required: false,
  })
  @ValidateIf((o) => !o.divisionId)
  @IsArray()
  @ArrayNotEmpty({ message: 'team must not be empty when provided' })
  @IsUUID('4', { each: true })
  team?: string[];

  @ApiProperty({
    description:
      'Division ID to use as the team. Division type must match event game type (e.g. 2v2 division for 2v2 event). Use either team or divisionId, not both.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @ValidateIf((o) => !o.team || o.team.length === 0)
  @IsOptional()
  @IsUUID('4')
  divisionId?: string;
}
