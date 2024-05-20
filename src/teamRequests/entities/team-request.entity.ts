import { Common } from "src/common/entities/CommonEntity";
import { Role } from "src/common/enums/role.enum";
import { Team } from "src/teams/entities/team.entity";
import {
  Entity,
  Column,
  ManyToOne,
} from "typeorm";
import { TeamRequestStatus } from "../enums/teamRequestStatus.enum";
import { User } from "src/users/entities/user.entity";

@Entity()
export class TeamRequest extends Common {
  @ManyToOne(() => Team, (team) => team.teamRequests, { nullable: false })
  team: Team | null;

  @ManyToOne(() => User, (user) => user.teamRequests, { nullable: false })
  user: User;

  @Column({ type: "varchar", length: 1000, nullable: true })
  message: string;

  @Column({
    type: "enum",
    enum: TeamRequestStatus,
    default: TeamRequestStatus.IN_PROGRESS,
  })
  status: TeamRequestStatus;
}
