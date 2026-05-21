import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReactionType } from '../enums/reaction-type.enum';

export class SetReactionDto {
  @ApiProperty({ enum: ReactionType, description: 'Reaction type' })
  @IsEnum(ReactionType)
  type: ReactionType;
}
