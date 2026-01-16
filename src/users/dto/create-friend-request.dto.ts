import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Validate } from "class-validator";
import { UserExistsRule } from "src/common/validators/user-exists.rule";

export class CreateFriendRequestDto {
  @ApiProperty()
  @IsInt()
  @Validate(UserExistsRule)
  recipient: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  message: string;
}
