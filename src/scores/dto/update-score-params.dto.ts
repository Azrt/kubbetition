import { IsNumberString, Validate } from "class-validator";
import { GameInProgressRule } from "../validation/game-in-progress.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";
import { GameScoreReadyRule } from "../validation/game-score-ready.rule";
import { GameUserRule } from "../validation/game-user.rule";

export class UpdateScoreParamsDto extends ContextAwareDto {
  @IsNumberString()
  @Validate(GameInProgressRule)
  @Validate(GameScoreReadyRule)
  @Validate(GameUserRule)
  scoreId: string;
}