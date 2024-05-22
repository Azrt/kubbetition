import { IsNumberString, Validate } from "class-validator";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";
import { GameInProgressRule } from "../validation/game-in-progress.rule";
import { GameUserRule } from "../validation/game-user.rule";

export class ScoreReadyParamsDto extends ContextAwareDto {
  @IsNumberString()
  @Validate(GameInProgressRule)
  @Validate(GameUserRule)
  scoreId: string;
}
