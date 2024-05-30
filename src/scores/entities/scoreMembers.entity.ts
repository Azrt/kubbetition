import { User } from "src/users/entities/user.entity";
import {
  Entity,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  PrimaryColumn,
} from "typeorm";
import { Score } from "./score.entity"

@Entity()
export class ScoreMembers {
  @PrimaryColumn({ name: "score_id" })
  scoreId: number;

  @PrimaryColumn({ name: "member_id" })
  memberId: number;

  @ManyToOne(() => Score)
  @JoinColumn({
    name: "score_id",
    referencedColumnName: "id",
  })
  score: Array<Score>;

  @ManyToMany(() => User)
  @JoinColumn({
    name: "member_id",
    referencedColumnName: "id",
  })
  members: Array<User>;
}
