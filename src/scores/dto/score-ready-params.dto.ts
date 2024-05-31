import { IsNumberString, Validate } from "class-validator";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";
import { GameInProgressRule } from "../validation/game-in-progress.rule";
import { GameUserRule } from "../validation/game-user.rule";
import { GameMembersNumberRule } from "../validation/game-members-number.rule";

export class ScoreReadyParamsDto extends ContextAwareDto {
  @IsNumberString()
  @Validate(GameInProgressRule)
  @Validate(GameUserRule)
  @Validate(GameMembersNumberRule)
  scoreId: string;
}
