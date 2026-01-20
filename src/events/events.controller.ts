import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { StartRoundDto } from './dto/start-round.dto';
import { Event } from './entities/event.entity';
import { Game } from 'src/games/entities/game.entity';
import { RequestWithUser } from 'src/auth/interfaces/requestWithUser.interface';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: RequestWithUser,
  ): Promise<Event> {
    return this.eventsService.create(createEventDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({
    status: 200,
    description: 'List of events',
    type: [Event],
  })
  async findAll(): Promise<Event[]> {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event details',
    type: Event,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Event> {
    return this.eventsService.findOne(id);
  }

  @Post(':id/rounds/start')
  @ApiOperation({ summary: 'Start a round of an event' })
  @ApiResponse({
    status: 201,
    description: 'Round started successfully, games created',
    type: [Game],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - only event creator can start rounds' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async startRound(
    @Param('id', ParseIntPipe) eventId: number,
    @Body() startRoundDto: StartRoundDto,
    @Request() req: RequestWithUser,
  ): Promise<Game[]> {
    return this.eventsService.startRound(eventId, startRoundDto, req.user);
  }
}
