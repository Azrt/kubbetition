import { IsUUID, Validate } from "class-validator";
import { FriendRequestExistsRule } from "../validators/friend-request-exists.rule";

export class FriendRequestParamDto {
  @IsUUID()
  @Validate(FriendRequestExistsRule)
  friendRequestId: string;
}
