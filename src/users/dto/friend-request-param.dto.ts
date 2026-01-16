import { IsNumberString, Validate } from "class-validator";
import { FriendRequestExistsRule } from "../validators/friend-request-exists.rule";

export class FriendRequestParamDto {
  @IsNumberString()
  @Validate(FriendRequestExistsRule)
  friendRequestId: string;
}
