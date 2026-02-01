import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';
import { IsArray, IsUUID, IsOptional, IsString, Validate } from 'class-validator';
import { CountryExistsRule } from 'src/common/validators/country-exists.rule';

export class UpdateTeamMembersDto extends PartialType(CreateTeamDto) {
  @ApiProperty({ isArray: true })
  @IsArray()
  @IsUUID('4', { each: true })
  members: Array<string>;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Validate(CountryExistsRule)
  country: string;
}
