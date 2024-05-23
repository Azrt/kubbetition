import { IsArray, MaxLength, MinLength } from "class-validator";
import { Common } from "src/common/entities/CommonEntity";
import { GameType } from "src/common/enums/gameType";
import { Score } from "src/scores/entities/score.entity";
import { TeamSection } from "src/teamSections/entities/teamSection.entity";
import { AfterLoad, Column, Entity, JoinColumn, OneToMany } from "typeorm";

@Entity()
export class Game extends Common {
  @Column({ type: "timestamptz", nullable: true })
  startTime: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  endTime: Date | null;

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

  winner: null | TeamSection;

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
  
      this.winner = winningScore?.teamSection ?? null;
    }

    this.isGameReady = !!this.scores?.every((score) => score.isReady);
  }
}
