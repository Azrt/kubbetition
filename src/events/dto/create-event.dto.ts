import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { GameType } from 'src/common/enums/gameType';

// Helper to transform string "true"/"false" to boolean
const ToBoolean = () => Transform(({ value }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
});

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
    description: 'Whether the event is publicly visible (non-admins can only see private events they participate in)',
    required: false,
    default: true,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Event details', example: 'Annual summer tournament' })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty({
    description: 'Game type determining team size',
    enum: GameType,
    example: GameType.TwoVsTwo,
  })
  @Type(() => Number)
  @IsEnum(GameType)
  gameType: GameType;

  @ApiProperty({
    description: 'Number of rounds in the event',
    example: 3,
    minimum: 1,
    maximum: 20,
  })
  @Type(() => Number)
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
    description: 'Duration for each round game in minutes',
    example: 20,
    required: false,
    minimum: 5,
    maximum: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(60)
  roundDuration?: number;

  @ApiProperty({
    description: 'Enable tournament mode with ranking-based matchmaking',
    example: false,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  tournamentMode?: boolean;

  @ApiProperty({
    description: 'Last time users can join this event (must be <= startTime). If omitted, startTime is used as join deadline.',
    required: false,
    example: '2024-12-31T09:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  joiningTime?: string;

  @ApiProperty({
    description: 'Event start time',
    example: '2024-12-31T10:00:00Z',
  })
  @IsDateString()
  startTime: string;
}
