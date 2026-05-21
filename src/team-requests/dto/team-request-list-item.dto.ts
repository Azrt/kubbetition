import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SimpleUserDto } from 'src/common/dto/simple-user.dto';
import { TeamRequestStatus } from '../enums/team-request-status.enum';

export class TeamRequestListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  message: string | null;

  @ApiProperty({ enum: TeamRequestStatus })
  status: TeamRequestStatus;

  @ApiProperty({ type: SimpleUserDto })
  user: SimpleUserDto;
}
