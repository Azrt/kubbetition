import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class MyEventsQueryDto {
  @ApiPropertyOptional({
    description: 'If true, includes past events. Default: false (only future events and today\'s events)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  showArchived?: boolean;
}
