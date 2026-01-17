import { Common } from "src/common/entities/CommonEntity";
import { GameType } from "src/common/enums/gameType";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";

@Entity()
export class Game extends Common {
  @Column({ type: "timestamptz", nullable: true })
  startTime: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  endTime: Date | null;

  @ManyToOne(() => User, (user) => user.createdGames, { nullable: true })
  createdBy: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: "game_participants",
    joinColumn: { name: "game_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "participant_id", referencedColumnName: "id" },
  })
  participants: User[];

  @Column({ type: "bool", default: false })
  isCancelled: boolean;

  @Column({
    type: "enum",
    enum: GameType,
    default: GameType.OneVsOne,
  })
  type: GameType;

  @Column({
    type: "int",
    default: 20,
  })
  duration: number;

  // Team 1
  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: "game_team1_members",
    joinColumn: { name: "game_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "member_id", referencedColumnName: "id" },
  })
  team1Members: User[];

  @Column({ type: "int", nullable: true })
  team1Score: number | null;

  @Column({ default: false })
  team1Ready: boolean;

  // Team 2
  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: "game_team2_members",
    joinColumn: { name: "game_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "member_id", referencedColumnName: "id" },
  })
  team2Members: User[];

  @Column({ type: "int", nullable: true })
  team2Score: number | null;

  @Column({ default: false })
  team2Ready: boolean;

  // Computed properties (populated after load)
  isGameReady: boolean;
  winner: 1 | 2 | null;
  allMembers: User[];
}
