import { ApiProperty } from "@nestjs/swagger";
import { Validate } from "class-validator";
import { GameReadyRule } from "../validation/game-ready.rule";

export class EndGameDto {
  @ApiProperty({ type: "string", format: "uuid" })
  @Validate(GameReadyRule)
  readonly gameId: string;
}
