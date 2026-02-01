import { Validate } from "class-validator";
import { CreatedByUserRule } from "../validation/created-by-user.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class CancelGameDto extends ContextAwareDto {
  @Validate(CreatedByUserRule)
  readonly gameId: string;
}
