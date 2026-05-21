import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SimpleUserDto } from 'src/common/dto/simple-user.dto';

export class SearchUserTeamDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class SearchUserResponseDto extends SimpleUserDto {
  @ApiPropertyOptional({ type: SearchUserTeamDto, nullable: true })
  team: SearchUserTeamDto | null;
}
