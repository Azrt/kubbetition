import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';
import { IsArray, IsInt, IsOptional, IsString, Validate } from 'class-validator';
import { CountryExistsRule } from 'src/common/validators/country-exists.rule';

export class UpdateTeamMembersDto extends PartialType(CreateTeamDto) {
  @ApiProperty({ isArray: true })
  @IsArray()
  @IsInt({ each: true })
  members: Array<number>;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Validate(CountryExistsRule)
  country: string;
}
