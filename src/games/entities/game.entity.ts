import { IsArray, MaxLength, MinLength } from "class-validator";
import { Common } from "src/common/entities/CommonEntity";
import { GameType } from "src/common/enums/gameType";
import { Score } from "src/scores/entities/score.entity";
import { User } from "src/users/entities/user.entity";
import { AfterLoad, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Game extends Common {
  @Column({ type: "timestamptz", nullable: true })
  startTime: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  endTime: Date | null;

  @ManyToOne(() => User, (user) => user.createdGames, { nullable: true })
  createdBy: User;

  @Column({ type: "bool", default: false })
  isCancelled: boolean;

  @ManyToMany(() => User, {
    cascade: true,
  })
  @JoinTable({
    name: "game_participants",
    joinColumn: {
      name: "game_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "member_id",
      referencedColumnName: "id",
    },
  })
  members: Array<User>;

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

  @IsArray()
  @MaxLength(2, { each: true })
  @MinLength(2, { each: true })
  @OneToMany(() => Score, (score) => score.game, {
    nullable: true,
  })
  @JoinColumn()
  scores: [Score, Score];

  isGameReady: boolean;

  winner: null | Score;

  @AfterLoad()
  afterLoad() {
    if (this.endTime) {
      const winningScore = this.scores?.reduce<Score | null>(
        (accumulator, current) => {
          if (current.score && current.score > (accumulator?.score ?? 0)) {
            return current;
          }

          return accumulator;
        },
        null
      );

      this.winner = winningScore;
    }

    this.isGameReady = !!this.scores?.every((score) => score.isReady);
  }
}
