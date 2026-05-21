import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { SimpleEventDto } from './dto/simple-event.dto';
import { MyEventsQueryDto } from './dto/my-events-query.dto';
import { RequestWithUser } from 'src/auth/interfaces/requestWithUser.interface';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';

/**
 * Separate controller so GET /events/me is never captured by GET /events/:id.
 */
@ApiTags('events')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller('events')
export class EventsMeController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Get events for the current user: created by them or where they are a participant. Same summary fields as the list endpoint.',
  })
  @ApiQuery({
    name: 'showArchived',
    required: false,
    type: Boolean,
    description: 'If true, includes past events. Default: false (only future events and today\'s events)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of the current user\'s events (summary view)',
    type: [SimpleEventDto],
  })
  async findMyEvents(
    @Query() query: MyEventsQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<SimpleEventDto[]> {
    return this.eventsService.findMyEvents(req.user, query.showArchived ?? false);
  }
}
