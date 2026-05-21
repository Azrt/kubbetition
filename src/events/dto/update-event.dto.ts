import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";
import { EventMode } from "../enums/event-mode.enum";
import { MAX_EVENT_PARTICIPANT_LIMIT, MIN_EVENT_PARTICIPANT_LIMIT } from "../events.helpers";

// Helper to transform location to PostgreSQL point format
// Accepts: JSON {x, y}, string "(x, y)", or string "x, y"
// Returns: PostgreSQL point format "(x, y)"
const ToPoint = () => Transform(({ value }) => {
  if (!value) return value;
  
  // If already in correct format "(x, y)", return as-is
  if (typeof value === 'string' && value.startsWith('(') && value.endsWith(')')) {
    return value;
  }
  
  // If it's a JSON object {x, y}
  if (typeof value === 'object' && value !== null && ('x' in value || 'X' in value)) {
    const x = value.x || value.X;
    const y = value.y || value.Y;
    if (typeof x === 'number' && typeof y === 'number') {
      return `(${x}, ${y})`;
    }
  }
  
  // If it's a string like "x, y" or "x,y"
  if (typeof value === 'string') {
    const cleaned = value.trim();
    // Try to parse as "x, y" or "x,y"
    const match = cleaned.match(/^([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)$/);
    if (match) {
      return `(${match[1]}, ${match[2]})`;
    }
  }
  
  // If we can't parse it, return as-is (will fail validation)
  return value;
});

export class UpdateEventDto {
  @ApiProperty({ description: 'Event name', example: 'Summer Tournament', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Event details', example: 'Annual summer tournament' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  details?: string;

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
  @IsOptional()
  rounds?: number;

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
    description: 'Event format mode',
    enum: EventMode,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventMode)
  mode?: EventMode;

  @ApiProperty({
    description: 'Maximum number of teams that can join',
    required: false,
    minimum: MIN_EVENT_PARTICIPANT_LIMIT,
    maximum: MAX_EVENT_PARTICIPANT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_EVENT_PARTICIPANT_LIMIT)
  @Max(MAX_EVENT_PARTICIPANT_LIMIT)
  participantLimit?: number;

  @ApiProperty({
    description: 'Event end date and time',
    required: false,
    example: '2024-12-31T18:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

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
  @IsOptional()
  startTime?: string;
}