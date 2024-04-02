import { GameType } from "src/common/enums/gameType";
import { Team } from "src/teams/entities/team.entity";
import { User } from "src/users/entities/user.entity";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from "typeorm";

@Entity()
export class TeamSection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, {
    nullable: false,
  })
  @JoinColumn()
  team: Team;

  @Column({
    type: "enum",
    enum: GameType,
    default: GameType.OneVsOne,
  })
  type: GameType;

  @ManyToMany(() => User, {
    cascade: true,
  })
  @JoinTable()
  members: Array<User>;
}
