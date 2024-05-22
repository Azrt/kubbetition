import { IsNumberString, Validate } from "class-validator";
import { GameInProgressRule } from "../validation/game-in-progress.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";
import { GameReadyRule } from "../validation/game-ready.rule";
import { GameUserRule } from "../validation/game-user.rule";

export class UpdateScoreParamsDto extends ContextAwareDto {
  @IsNumberString()
  @Validate(GameInProgressRule)
  @Validate(GameReadyRule)
  @Validate(GameUserRule)
  scoreId: string;
}