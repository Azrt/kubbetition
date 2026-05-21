import { Common } from 'src/common/entities/CommonEntity';
import { GameType } from 'src/common/enums/gameType';
import { Game } from 'src/games/entities/game.entity';
import { User } from 'src/users/entities/user.entity';
import { EventMode } from '../enums/event-mode.enum';
import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
@Index('IDX_event_start_time', ['startTime'])
@Index('IDX_event_is_public', ['isPublic'])
@Check('CHK_event_rounds', '"rounds" >= 1')
@Check('CHK_event_current_round', '"currentRound" >= 0')
export class Event extends Common {
  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true, length: 450 })
  image: string;

  /**
   * Participants: array of teams. Each team is either:
   * - string[] (legacy): user IDs
   * - { userIds: string[], divisionId?: string, teamId?: string }: when joined via division, so round games can set game.team1Division/team2Division
   */
  @Column({ type: 'json', nullable: true })
  participants: Array<Array<string> | { userIds: string[]; divisionId?: string | null; teamId?: string | null }>;

  @Column({ length: 500 })
  details: string;

  @Column({ type: 'bool', default: true })
  isPublic: boolean;

  @Column({
    type: "enum",
    enum: GameType,
    default: GameType.OneVsOne,
  })
  gameType: GameType;

  @Column({ type: "int", default: 1 })
  rounds: number;

  @Column({ type: "int", default: 0 })
  currentRound: number;

  @Column({ type: "point", nullable: true })
  location: string;

  @Column({ type: "int", nullable: true })
  roundDuration: number;

  @Column({
    type: 'enum',
    enum: EventMode,
    default: EventMode.LimitedRounds,
  })
  mode: EventMode;

  /**
   * Max number of teams (participant entries) allowed to join.
   * Required for tournament and free-for-all modes.
   */
  @Column({ type: 'int', nullable: true })
  participantLimit: number | null;

  /**
   * Scheduled end of the event. Required for limited-rounds mode.
   */
  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date | null;

  /**
   * Last moment users are allowed to join this event.
   * Must be <= startTime. If null, startTime is used as the join deadline.
   */
  @Column({ type: 'timestamptz', nullable: true })
  joiningTime: Date | null;

  @Column({ type: "timestamptz" })
  startTime: Date;

  @ManyToOne(() => User, {
    nullable: false,
  })
  createdBy: User;

  @OneToMany(() => Game, (game) => game.event)
  games: Game[];

  @DeleteDateColumn()
  deletedAt: Date | null;
}
