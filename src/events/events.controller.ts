import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { StartRoundDto } from './dto/start-round.dto';
import { Event } from './entities/event.entity';
import { Game } from 'src/games/entities/game.entity';
import { RequestWithUser } from 'src/auth/interfaces/requestWithUser.interface';
import { JoinEventDto } from './dto/join-event.dto';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { UpdateEventDto } from './dto/update-event.dto';
import { RankingEntryDto } from './dto/ranking-response.dto';
import { FileUploadService, FileType } from 'src/common/services/file-upload.service';

@ApiTags('events')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

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
  async findAll(@Request() req: RequestWithUser): Promise<Event[]> {
    return this.eventsService.findAllVisible(req.user);
  }

  @Get(':id/games')
  @ApiOperation({ summary: 'Get all games of an event' })
  @ApiResponse({
    status: 200,
    description: 'List of games. Admins/creators see all games, participants see only their games',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not allowed to access this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getGames(
    @Param('id') eventId: string,
    @Request() req: RequestWithUser,
  ): Promise<Game[]> {
    return this.eventsService.getGames(eventId, req.user);
  }

  @Get(':id/ranking')
  @ApiOperation({ summary: 'Get event ranking/standings' })
  @ApiQuery({
    name: 'round',
    required: false,
    type: Number,
    description: 'Optional round number. If provided and valid, returns standings up to that round. If invalid or not provided, returns standings based on all games.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking list sorted from first to last place',
    type: [RankingEntryDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not allowed to access this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getRanking(
    @Param('id') eventId: string,
    @Query('round') round?: string,
    @Request() req?: RequestWithUser,
  ): Promise<RankingEntryDto[]> {
    const roundNumber = round ? parseInt(round, 10) : undefined;
    return this.eventsService.getRanking(eventId, roundNumber, req?.user);
  }

  @Get(':id/games/active')
  @ApiOperation({ summary: 'Get active games of an event' })
  @ApiResponse({
    status: 200,
    description: 'List of active games',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not allowed to access this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getActiveGames(
    @Param('id') eventId: string,
    @Request() req: RequestWithUser,
  ): Promise<Game[]> {
    return this.eventsService.getActiveGames(eventId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event details',
    type: Event,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Event> {
    return this.eventsService.findOneVisible(id, req.user);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join an existing, not started event (adds a team of users)' })
  @ApiResponse({
    status: 200,
    description: 'Joined successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async join(
    @Param('id') eventId: string,
    @Body() body: JoinEventDto,
    @Request() req: RequestWithUser,
  ): Promise<Event> {
    return this.eventsService.join(eventId, body.team, req.user);
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
    @Param('id') eventId: string,
    @Body() startRoundDto: StartRoundDto,
    @Request() req: RequestWithUser,
  ): Promise<Game[]> {
    return this.eventsService.startRound(eventId, startRoundDto, req.user);
  }

  @Post(':id/rounds/end')
  @ApiOperation({ summary: 'End the current round of an event' })
  @ApiResponse({
    status: 200,
    description: 'Round ended successfully, all games updated',
    type: [Game],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - only admin, superadmin, or event creator can end rounds' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async endRound(
    @Param('id') eventId: string,
    @Request() req: RequestWithUser,
  ): Promise<Game[]> {
    return this.eventsService.endRound(eventId, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(@Param('id') eventId: string, @Body() updateEventDto: UpdateEventDto, @Request() req: RequestWithUser): Promise<Event> {
    return this.eventsService.update(eventId, updateEventDto, req.user);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave an event' })
  @ApiResponse({
    status: 200,
    description: 'Left successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async leave(@Param('id') eventId: string, @Request() req: RequestWithUser): Promise<Event> {
    return this.eventsService.leave(eventId, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
    type: Event,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async delete(@Param('id') eventId: string, @Request() req: RequestWithUser): Promise<void> {
    return this.eventsService.delete(eventId, req.user);
  }
}
