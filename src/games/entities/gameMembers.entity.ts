import { User } from "src/users/entities/user.entity";
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  ManyToMany,
} from "typeorm";
import { Game } from "./game.entity";

@Entity()
export class GameMembers {
  @PrimaryColumn({ name: "game_id" })
  gameId: number;

  @PrimaryColumn({ name: "member_id" })
  memberId: number;

  @ManyToOne(() => Game, (game) => game.members)
  @JoinColumn({
    name: "game_id",
    referencedColumnName: "id",
  })
  games: Array<Game>;

  @ManyToMany(() => User)
  @JoinColumn({
    name: "member_id",
    referencedColumnName: "id",
  })
  members: Array<User>;
}
