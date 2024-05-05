import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  readonly token: string;
}
