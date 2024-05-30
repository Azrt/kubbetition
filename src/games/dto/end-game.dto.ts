import { Validate } from "class-validator";
import { GameReadyRule } from "../validation/game-ready.rule";

export class EndGameDto {
  @Validate(GameReadyRule)
  readonly gameId: number;
}
