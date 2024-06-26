import { Validate } from "class-validator";
import { IsCurrentUserRule } from "../validators/is-current-user.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class UpdateUserParam extends ContextAwareDto {
  @Validate(IsCurrentUserRule)
  id: number;
}