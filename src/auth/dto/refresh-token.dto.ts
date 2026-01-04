import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token to exchange for new tokens' })
  @IsDefined()
  @IsString()
  readonly refreshToken: string;
}

