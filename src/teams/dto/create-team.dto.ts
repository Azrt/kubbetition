import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Validate } from 'class-validator';
import { CountryExistsRule } from 'src/common/validators/country-exists.rule';

export class CreateTeamDto {
  @ApiProperty({ readOnly: true })
  readonly id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  logo: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @ApiProperty()
  @IsString()
  @Validate(CountryExistsRule)
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  details: string;
}
