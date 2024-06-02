import { IsNumberString, Validate } from "class-validator";
import { GameInProgressRule } from "../validation/game-in-progress.rule";
import { CanJoinGameRule } from "../validation/can-join-game.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";
import { ScoreExistsRule } from "../validation/score-exists.rule";

export class JoinScoreParams extends ContextAwareDto {
  @IsNumberString()
  @Validate(ScoreExistsRule)
  @Validate(GameInProgressRule)
  @Validate(CanJoinGameRule)
  scoreId: string;
}
