import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SimpleUserDto } from 'src/common/dto/simple-user.dto';
import { FriendRequestStatus } from '../enums/friend-request-status.enum';

export class FriendRequestListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  message: string | null;

  @ApiProperty({ enum: FriendRequestStatus })
  status: FriendRequestStatus;

  @ApiProperty({ type: SimpleUserDto })
  requester: SimpleUserDto;

  @ApiProperty({ type: SimpleUserDto })
  recipient: SimpleUserDto;
}
