import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Validate } from 'class-validator';
import { CountryExistsRule } from 'src/common/validators/country-exists.rule';

export class CreateTeamDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  logo: string;

  @ApiProperty()
  @IsString()
  @Validate(CountryExistsRule)
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  details: string;
}
