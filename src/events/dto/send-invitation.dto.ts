import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SendInvitationDto {
  @ApiProperty({
    description: 'User ID to invite to the event',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  userId: string;
}
