import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsString } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ readOnly: true })
  readonly id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
