import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';

export class TeamMemberDto {
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

  @ApiProperty({ enum: Role, description: 'User role; SUPERVISOR indicates team supervisor.' })
  role: Role;
}

export function toTeamMember(user: User): TeamMemberDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image ?? null,
    country: user.country ?? null,
    role: user.role,
  };
}
