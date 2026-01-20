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
  // Example: [[1, 2], [3, 4]] for 2v2, where each inner array is a team
  @Column({ type: 'json', nullable: true })
  participants: Array<Array<number>>;

  @Column({ length: 500 })
  details: string;

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

  @Column({ type: "timestamptz" })
  startTime: Date;

  @ManyToOne(() => User, {
    nullable: false,
  })
  createdBy: User;

  @OneToMany(() => Game, (game) => game.event)
  games: Game[];
}
