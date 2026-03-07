import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { GameType } from 'src/common/enums/gameType';
import { CreateDivisionDto } from './create-division.dto';

export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {
  @ApiProperty({ description: 'Division display name', required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Division type (2v2, 3v3, 4v4, 6v6). If changed, memberIds length must match.',
    enum: [GameType.TwoVsTwo, GameType.ThreeVsThree, GameType.FourVsFour, GameType.SixVsSix],
    required: false,
  })
  @IsOptional()
  @IsEnum(GameType)
  type?: GameType;

  @ApiProperty({
    description: 'Team member user IDs. Length must exactly match type.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
