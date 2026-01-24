import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateEventDto {
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
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  rounds?: number;

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
  @IsOptional()
  startTime?: string;
}