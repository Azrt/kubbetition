import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsOptional,
  IsNumber,
  ArrayNotEmpty,
} from 'class-validator';
import { GameType } from 'src/common/enums/gameType';

export class CreateEventDto {
  @ApiProperty({ description: 'Event name', example: 'Summer Tournament' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Event image URL',
    required: false,
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Array of participant teams. Each team is an array of user IDs',
    example: [
      [1, 2],
      [3, 4],
    ],
    type: [[Number]],
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 teams are required' })
  @IsArray({ each: true })
  @ArrayNotEmpty({ each: true })
  @IsNumber({}, { each: true })
  participants: Array<Array<number>>;

  @ApiProperty({ description: 'Event details', example: 'Annual summer tournament' })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty({
    description: 'Game type determining team size',
    enum: GameType,
    example: GameType.TwoVsTwo,
  })
  @IsEnum(GameType)
  gameType: GameType;

  @ApiProperty({
    description: 'Number of rounds in the event',
    example: 3,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  rounds: number;

  @ApiProperty({
    description: 'Event location (point)',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Event start time',
    example: '2024-12-31T10:00:00Z',
  })
  @IsDateString()
  startTime: string;
}
