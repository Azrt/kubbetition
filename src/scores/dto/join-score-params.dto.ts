import { IsNumberString, Validate } from "class-validator";
import { GameInProgressRule } from "../validation/game-in-progress.rule";
import { GameUserRule } from "../validation/game-user.rule";
import { CanJoinGameRule } from "../validation/can-join-game.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class JoinScoreParams extends ContextAwareDto {
  @IsNumberString()
  @Validate(GameInProgressRule)
  @Validate(GameUserRule)
  @Validate(CanJoinGameRule)
  scoreId: string;
}
