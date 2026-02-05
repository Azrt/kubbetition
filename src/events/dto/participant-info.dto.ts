import { ApiProperty } from '@nestjs/swagger';

export class ParticipantInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Team name (if user belongs to a team)', nullable: true })
  teamName: string | null;

  @ApiProperty({ description: 'Avatar URL (public URL for user avatar)', nullable: true })
  avatarUrl: string | null;
}
