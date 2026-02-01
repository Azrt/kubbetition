import { Common } from 'src/common/entities/CommonEntity';
import { GameType } from 'src/common/enums/gameType';
import { Game } from 'src/games/entities/game.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
export class Event extends Common {
  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true, length: 450 })
  image: string;

  // Participants stored as array of arrays of user IDs
  // Example: [["uuid1", "uuid2"], ["uuid3", "uuid4"]] for 2v2, where each inner array is a team
  @Column({ type: 'json', nullable: true })
  participants: Array<Array<string>>;

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

  @Column({ type: "bool", default: false })
  tournamentMode: boolean;

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
}
