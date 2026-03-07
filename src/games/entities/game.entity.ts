import { Common } from "src/common/entities/CommonEntity";
import { GameType } from "src/common/enums/gameType";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { Event as EventEntity } from "src/events/entities/event.entity";
import { Division } from "src/teams/entities/division.entity";

@Entity()
@Index('IDX_game_winner', ['winner'])
@Index('IDX_game_end_time', ['endTime'])
export class Game extends Common {
  @Column({ type: "timestamptz", nullable: true })
  startTime: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  endTime: Date | null;

  @ManyToOne(() => User, (user) => user.createdGames, { nullable: true })
  createdBy: User;

  /**
   * Flat list of all players (invitees/participants). When both teams are set,
   * should equal team1Members ∪ team2Members. Kept for backward compatibility
   * and for ad-hoc games where teams are assigned later.
   */
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
  @ManyToOne(() => Division, { nullable: true, onDelete: "SET NULL" })
  @Index('IDX_game_team1_division_id')
  team1Division: Division | null; // FK column team1DivisionId indexed for division history queries

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
  @ManyToOne(() => Division, { nullable: true, onDelete: "SET NULL" })
  @Index('IDX_game_team2_division_id')
  team2Division: Division | null; // FK column team2DivisionId indexed for division history queries

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

  /** Persisted for filtering and division/user stats. 1 = team1 won, 2 = team2 won, null = tie or not finished. */
  @Column({ type: "smallint", nullable: true })
  winner: 1 | 2 | null;

  // Computed (populated after load)
  isGameReady: boolean;
  allMembers: User[];

  @ManyToOne(() => EventEntity, (event) => event.games, { nullable: true })
  event: EventEntity;

  @Column({ type: "int", nullable: true })
  round: number | null;

  @Column({ nullable: true, length: 450 })
  socialPhoto: string | null;
}
