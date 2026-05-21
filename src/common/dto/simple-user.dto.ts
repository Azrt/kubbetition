import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';

export class SimpleUserDto {
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
}

export function toSimpleUser(user: User): SimpleUserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image ?? null,
    country: user.country ?? null,
  };
}
