import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEmail } from "class-validator";

export class ResendVerificationEmailDto {
  @ApiProperty()
  @IsDefined()
  @IsEmail()
  readonly email: string;
}
