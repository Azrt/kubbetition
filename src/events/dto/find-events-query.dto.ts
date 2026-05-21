import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { EventListSort } from '../enums/event-list-sort.enum';
import {
  EVENTS_MAX_PAGE_LIMIT,
  NEARBY_EVENTS_MAX_RADIUS_KM,
  NEARBY_EVENTS_MIN_RADIUS_KM,
} from '../events.constants';

export class FindEventsQueryDto {
  @ApiPropertyOptional({
    description: 'If true, includes past events. Default: false (only future events and today\'s events)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  showArchived?: boolean;

  @ApiPropertyOptional({
    description: 'Latitude for nearby search (must be used with lng).',
    example: 52.4,
  })
  @IsOptional()
  @Type(() => Number)
  @ValidateIf((o: FindEventsQueryDto) => o.lng != null)
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude for nearby search (must be used with lat).',
    example: 16.93,
  })
  @IsOptional()
  @Type(() => Number)
  @ValidateIf((o: FindEventsQueryDto) => o.lat != null)
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({
    description:
      'Optional search radius in km (requires lat and lng). When omitted, no distance limit is applied.',
    example: 50,
    minimum: NEARBY_EVENTS_MIN_RADIUS_KM,
    maximum: NEARBY_EVENTS_MAX_RADIUS_KM,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(NEARBY_EVENTS_MIN_RADIUS_KM)
  @Max(NEARBY_EVENTS_MAX_RADIUS_KM)
  @ValidateIf((o: FindEventsQueryDto) => o.lat != null && o.lng != null)
  radiusKm?: number;

  @ApiPropertyOptional({
    enum: EventListSort,
    description:
      'Sort order. distance = closest first (requires lat and lng). Without sort, lat/lng still apply the default radius filter and sort by distance.',
  })
  @IsOptional()
  @IsEnum(EventListSort)
  sort?: EventListSort;

  @ApiPropertyOptional({
    description: 'Page number (default: 1)',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page (default: 20, max: 50)',
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
