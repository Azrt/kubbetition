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
  @JoinTable({
    name: "team_section_members",
    joinColumn: {
      name: "team_section_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "member_id",
      referencedColumnName: "id",
    },
  })
  members: Array<User>;
}
