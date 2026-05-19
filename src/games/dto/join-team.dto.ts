import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsUUID } from "class-validator";
import { ContextAwareDto } from "src/common/dto/context-aware.dto";

export class JoinTeamParamsDto extends ContextAwareDto {
  @ApiProperty({ type: "string", format: "uuid" })
  @IsUUID()
  gameId: string;

  @IsIn(['1', '2'])
  team: '1' | '2';
}







