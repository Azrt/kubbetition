import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString, IsUUID, Length } from 'class-validator';
import { GameType } from 'src/common/enums/gameType';

export class CreateDivisionDto {
  @ApiProperty({ description: 'Division display name', example: 'Alpha Squad', maxLength: 160 })
  @IsString()
  @Length(1, 160)
  name: string;

  @ApiProperty({
    description: 'Division type (team size). Must be 2v2, 3v3, 4v4, or 6v6 (no 1v1).',
    enum: [GameType.TwoVsTwo, GameType.ThreeVsThree, GameType.FourVsFour, GameType.SixVsSix],
    example: GameType.TwoVsTwo,
  })
  @IsEnum(GameType)
  type: GameType;

  @ApiProperty({
    description: 'Team member user IDs. Length must exactly match type (e.g. 2 IDs for 2v2).',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
