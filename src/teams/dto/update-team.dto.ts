import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';
import { IsArray, IsUUID, IsOptional, IsString, Validate } from 'class-validator';
import { CountryExistsRule } from 'src/common/validators/country-exists.rule';

export class UpdateTeamMembersDto extends PartialType(CreateTeamDto) {
  @ApiProperty({ isArray: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  members: Array<string>;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Validate(CountryExistsRule)
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  details: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  logo: string;
}
