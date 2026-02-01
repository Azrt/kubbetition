import { IsUUID, Validate } from "class-validator";
import { IsCurrentUserRule } from "../validators/is-current-user.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class UpdateUserParam extends ContextAwareDto {
  @IsUUID()
  @Validate(IsCurrentUserRule)
  id: string;
}