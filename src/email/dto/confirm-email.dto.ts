import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmEmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}
