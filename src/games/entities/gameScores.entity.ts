import { User } from "src/users/entities/user.entity";
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  OneToMany,
} from "typeorm";
import { Game } from "./game.entity";
import { Score } from "src/scores/entities/score.entity";

@Entity()
export class GameScores {
  @PrimaryColumn({ name: "game_id" })
  gameId: number;

  @PrimaryColumn({ name: "score_id" })
  scoreId: number;

  @ManyToOne(() => Game, (game) => game.scores)
  @JoinColumn({
    name: "game_id",
    referencedColumnName: "id",
  })
  games: Array<Game>;

  @OneToMany(() => Score, (score) => score.game)
  @JoinColumn({
    name: "score_id",
    referencedColumnName: "id",
  })
  scores: Array<Score>;
}
