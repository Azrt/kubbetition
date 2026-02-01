import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsOptional, IsString, Validate } from "class-validator";
import { UserExistsRule } from "src/common/validators/user-exists.rule";

export class CreateFriendRequestDto {
  @ApiProperty()
  @IsUUID()
  @Validate(UserExistsRule)
  recipient: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  message: string;
}
