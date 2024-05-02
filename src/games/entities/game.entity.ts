import { IsArray, MaxLength, MinLength } from "class-validator";
import { Common } from "src/common/entities/CommonEntity";
import { GameType } from "src/common/enums/gameType";
import { Score } from "src/scores/entities/score.entity";
import { TeamSection } from "src/teamSections/entities/teamSection.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Game extends Common {
  @Column({ type: "timestamptz", nullable: true })
  startTime: Date;

  @Column({ type: "timestamptz", nullable: true })
  endTime: Date | null;

  @Column({
    type: "enum",
    enum: GameType,
    default: GameType.OneVsOne,
  })
  type: GameType;

  @ManyToOne(() => TeamSection, (section) => section.wins, {
    onDelete: "SET NULL",
    onUpdate: "NO ACTION",
    nullable: true,
  })
  @JoinColumn()
  winner: TeamSection;

  @IsArray()
  @MaxLength(2, { each: true })
  @MinLength(2, { each: true })
  @OneToMany(() => Score, (score) => score.game, {
    nullable: true,
  })
  @JoinColumn()
  scores: [Score, Score];
}
