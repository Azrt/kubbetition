import { ApiProperty } from "@nestjs/swagger";
import { Validate } from "class-validator";
import { CreatedByUserRule } from "../validation/created-by-user.rule";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class CancelGameDto extends ContextAwareDto {
  @ApiProperty({ type: "string", format: "uuid" })
  @Validate(CreatedByUserRule)
  readonly gameId: string;
}
