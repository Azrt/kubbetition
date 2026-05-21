import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  ValidateIf,
} from 'class-validator';
import { GameType } from 'src/common/enums/gameType';
import { EventMode } from '../enums/event-mode.enum';
import {
  MAX_EVENT_PARTICIPANT_LIMIT,
  MIN_EVENT_PARTICIPANT_LIMIT,
} from '../events.helpers';

// Helper to transform string "true"/"false" to boolean
const ToBoolean = () => Transform(({ value }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
});

// Helper to transform location to PostgreSQL point format
// Accepts: JSON {x, y}, JSON string '{"x":...,"y":...}', string "(x, y)", or string "x, y"
// Returns: PostgreSQL point format "(x, y)"
const ToPoint = () => Transform(({ value }) => {
  if (!value) return value;
  
  // If already in correct format "(x, y)", return as-is
  if (typeof value === 'string' && value.startsWith('(') && value.endsWith(')')) {
    return value;
  }
  
  // If it's a JSON string, try to parse it
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && ('x' in parsed || 'X' in parsed)) {
        const x = parsed.x || parsed.X;
        const y = parsed.y || parsed.Y;
        if (typeof x === 'number' && typeof y === 'number') {
          return `(${x}, ${y})`;
        }
      }
    } catch (e) {
      // Not JSON, continue to other parsing
    }
    
    // Try to parse as "x, y" or "x,y"
    const cleaned = value.trim();
    const match = cleaned.match(/^([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)$/);
    if (match) {
      return `(${match[1]}, ${match[2]})`;
    }
  }
  
  // If it's a JSON object {x, y}
  if (typeof value === 'object' && value !== null && ('x' in value || 'X' in value)) {
    const x = value.x || value.X;
    const y = value.y || value.Y;
    if (typeof x === 'number' && typeof y === 'number') {
      return `(${x}, ${y})`;
    }
  }
  
  // If we can't parse it, return as-is (will fail validation)
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
    description: 'Event format mode',
    enum: EventMode,
    example: EventMode.Tournament,
  })
  @IsEnum(EventMode)
  mode: EventMode;

  @ApiProperty({
    description: 'Number of rounds (required for tournament and limited_rounds modes)',
    example: 3,
    minimum: 1,
    maximum: 20,
    required: false,
  })
  @ValidateIf((dto: CreateEventDto) =>
    dto.mode === EventMode.Tournament || dto.mode === EventMode.LimitedRounds,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  rounds?: number;

  @ApiProperty({
    description:
      'Maximum number of teams that can join (required for tournament and free_for_all; max 20)',
    example: 8,
    minimum: MIN_EVENT_PARTICIPANT_LIMIT,
    maximum: MAX_EVENT_PARTICIPANT_LIMIT,
    required: false,
  })
  @ValidateIf((dto: CreateEventDto) =>
    dto.mode === EventMode.Tournament || dto.mode === EventMode.FreeForAll,
  )
  @Type(() => Number)
  @IsInt()
  @Min(MIN_EVENT_PARTICIPANT_LIMIT)
  @Max(MAX_EVENT_PARTICIPANT_LIMIT)
  participantLimit?: number;

  @ApiProperty({
    description: 'Event location (point). Accepts: JSON {x, y}, string "(x, y)", or string "x, y"',
    required: false,
    example: '(16.93, 52.40)',
  })
  @IsOptional()
  @ToPoint()
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

  @ApiProperty({
    description: 'Event end date and time (required for limited_rounds mode; must be after startTime)',
    required: false,
    example: '2024-12-31T18:00:00Z',
  })
  @ValidateIf((dto: CreateEventDto) => dto.mode === EventMode.LimitedRounds)
  @IsDateString()
  endTime?: string;
}
