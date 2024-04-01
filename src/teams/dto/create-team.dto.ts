import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

export class CreateTeamDto {
  @ApiProperty({ readOnly: true })
  readonly id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ isArray: true })
  members: Array<CreateUserDto>;
}
