import { Common } from "src/common/entities/CommonEntity";
import { User } from "./user.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { FriendRequestStatus } from "../enums/friend-request-status.enum";

@Entity()
export class FriendRequest extends Common {
  @ManyToOne(() => User, (user) => user.sentFriendRequests, {
    nullable: false,
  })
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests, {
    nullable: false,
  })
  recipient: User;

  @Column({ type: "varchar", length: 1000, nullable: true })
  message: string;

  @Column({
    type: "enum",
    enum: FriendRequestStatus,
    default: FriendRequestStatus.IN_PROGRESS,
  })
  status: FriendRequestStatus;
}
