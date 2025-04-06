import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateUserTokenDto {
  @IsString()
  @ApiProperty()
  token: string;
}
