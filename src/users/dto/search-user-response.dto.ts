import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUserTeamDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class SearchUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiPropertyOptional({ nullable: true })
  country: string | null;

  @ApiPropertyOptional({ type: SearchUserTeamDto, nullable: true })
  team: SearchUserTeamDto | null;
}
