import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EVENTS_MAX_PAGE_LIMIT } from '../events.constants';

export class MyEventsQueryDto {
  @ApiPropertyOptional({
    description: 'If true, includes past events. Default: false (only future events and today\'s events)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  showArchived?: boolean;

  @ApiPropertyOptional({
    description:
      'Maximum number of events to return, ordered by startTime. Use limit=1 for the closest upcoming event (dashboard).',
    minimum: 1,
    maximum: EVENTS_MAX_PAGE_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(EVENTS_MAX_PAGE_LIMIT)
  limit?: number;
}
