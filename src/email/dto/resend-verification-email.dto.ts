import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsString } from "class-validator";

export class ResendVerificationEmailDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  readonly email: string;
}
