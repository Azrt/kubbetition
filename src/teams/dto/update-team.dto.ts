import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';
import { IsArray, IsInt } from 'class-validator';

export class UpdateTeamMembersDto extends PartialType(CreateTeamDto) {
  @ApiProperty({ isArray: true })
  @IsArray()
  @IsInt({ each: true })
  members: Array<number>;
}
