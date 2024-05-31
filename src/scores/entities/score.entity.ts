import { Common } from "src/common/entities/CommonEntity";
import { Game } from "src/games/entities/game.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";

@Entity()
export class Score extends Common {
  @Column({ type: "int", nullable: true })
  score: number | null;

  @ManyToMany(() => User, {
    cascade: true,
  })
  @JoinTable({
    name: "score_members",
    joinColumn: {
      name: "score_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "member_id",
      referencedColumnName: "id",
    },
  })
  members: Array<User>;

  @ManyToOne(() => Game, (game) => game.scores, {
    cascade: true,
    nullable: true,
  })
  game: Game;

  @Column({ default: null })
  gameId: number;

  @Column({ default: false, type: "boolean" })
  isReady: boolean;
}
