import { Common } from "src/common/entities/CommonEntity";
import { Team } from "src/teams/entities/team.entity";
import {
  Entity,
  Column,
  Index,
  ManyToOne,
} from "typeorm";
import { TeamRequestStatus } from "../enums/team-request-status.enum";
import { User } from "src/users/entities/user.entity";

@Entity()
@Index('IDX_team_request_status', ['status'])
export class TeamRequest extends Common {
  @ManyToOne(() => Team, (team) => team.teamRequests, { nullable: false })
  @Index('IDX_team_request_team')
  team: Team | null;

  @ManyToOne(() => User, (user) => user.teamRequests, { nullable: false })
  @Index('IDX_team_request_user')
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
