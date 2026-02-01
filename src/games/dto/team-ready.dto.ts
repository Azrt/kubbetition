import { IsIn, IsUUID } from "class-validator";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class TeamReadyParamsDto extends ContextAwareDto {
  @IsUUID()
  gameId: string;

  @IsIn(['1', '2'])
  team: '1' | '2';
}







