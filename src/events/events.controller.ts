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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
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
import { SendInvitationDto } from './dto/send-invitation.dto';
import { EventInvitation } from './entities/event-invitation.entity';

@ApiTags('events')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new event (accepts form data with optional image)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'details', 'gameType', 'rounds', 'startTime'],
      properties: {
        name: { type: 'string', description: 'Event name', example: 'Summer Tournament' },
        details: { type: 'string', description: 'Event details', example: 'Annual summer tournament' },
        gameType: { type: 'number', description: 'Game type (1=1v1, 2=2v2, etc.)', example: 2 },
        rounds: { type: 'number', description: 'Number of rounds', example: 3 },
        startTime: { type: 'string', format: 'date-time', description: 'Event start time', example: '2024-12-31T10:00:00Z' },
        joiningTime: { type: 'string', format: 'date-time', description: 'Last time to join (optional)' },
        location: { type: 'string', description: 'Location as point (x, y)', example: '(16.93, 52.40)' },
        roundDuration: { type: 'number', description: 'Round duration in minutes', example: 20 },
        tournamentMode: { type: 'boolean', description: 'Enable tournament mode' },
        isPublic: { type: 'boolean', description: 'Whether event is public', default: true },
        image: { type: 'string', format: 'binary', description: 'Event image (JPEG, PNG, or WebP)' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req: RequestWithUser,
  ): Promise<Event & { imageUrl: string | null }> {
    return this.eventsService.create(createEventDto, req.user, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events (includes presigned imageUrl and participant info for each event). By default returns only future events and events from today. Participant info (firstName, lastName, teamName, avatarUrl) is returned for public events to all users.' })
  @ApiQuery({
    name: 'showArchived',
    required: false,
    type: Boolean,
    description: 'If true, includes past events. Default: false (only future events and today\'s events)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events with presigned image URLs and participant information',
    type: [Event],
  })
  async findAll(
    @Query('showArchived') showArchived?: string,
    @Request() req?: RequestWithUser,
  ): Promise<Array<Event & { imageUrl: string | null; participantsInfo: Array<Array<any>> | null }>> {
    // Convert string to boolean (query params come as strings)
    const includeArchived = showArchived === 'true';
    return this.eventsService.findAllVisible(req.user, includeArchived);
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
  @ApiOperation({ summary: 'Get event by ID (includes presigned imageUrl and participant info)' })
  @ApiResponse({
    status: 200,
    description: 'Event details with presigned image URL and participant information',
    type: Event,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Event & { imageUrl: string | null; participantsInfo: Array<Array<any>> | null }> {
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

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Send an invitation to a user for a private event' })
  @ApiResponse({
    status: 201,
    description: 'Invitation sent successfully',
    type: EventInvitation,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invitation already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - only event creator or admin can send invitations' })
  @ApiResponse({ status: 404, description: 'Event or user not found' })
  async sendInvitation(
    @Param('id') eventId: string,
    @Body() sendInvitationDto: SendInvitationDto,
    @Request() req: RequestWithUser,
  ): Promise<EventInvitation> {
    return this.eventsService.sendInvitation(eventId, sendInvitationDto.userId, req.user);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Get all invitations for an event' })
  @ApiResponse({
    status: 200,
    description: 'List of invitations',
    type: [EventInvitation],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - only event creator or admin can view invitations' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getInvitations(
    @Param('id') eventId: string,
    @Request() req: RequestWithUser,
  ): Promise<EventInvitation[]> {
    return this.eventsService.getEventInvitations(eventId, req.user);
  }

  @Delete(':id/invitations/:userId')
  @ApiOperation({ summary: 'Delete an invitation' })
  @ApiResponse({
    status: 200,
    description: 'Invitation deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not allowed to delete this invitation' })
  @ApiResponse({ status: 404, description: 'Event or invitation not found' })
  async deleteInvitation(
    @Param('id') eventId: string,
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.eventsService.deleteInvitation(eventId, userId, req.user);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload an image for an event (stored in private S3 bucket)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, or WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file type or no file provided' })
  @ApiResponse({ status: 403, description: 'Forbidden - only event creator or admin can upload image' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async uploadImage(
    @Param('id') eventId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ): Promise<Event> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return this.eventsService.uploadImage(eventId, file, req.user);
  }

  @Get(':id/image-url')
  @ApiOperation({ summary: 'Get a presigned URL to access the event image (private S3 bucket)' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Presigned URL for accessing the image' },
        expiresIn: { type: 'number', description: 'URL expiration time in seconds' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Event not found or event has no image' })
  async getImageUrl(
    @Param('id') eventId: string,
    @Request() req: RequestWithUser,
  ): Promise<{ url: string; expiresIn: number }> {
    return this.eventsService.getImagePresignedUrl(eventId, req.user);
  }

  @Delete(':id/image')
  @ApiOperation({ summary: 'Delete the event image' })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
    type: Event,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - only event creator or admin can delete image' })
  @ApiResponse({ status: 404, description: 'Event not found or event has no image' })
  async deleteImage(
    @Param('id') eventId: string,
    @Request() req: RequestWithUser,
  ): Promise<Event> {
    return this.eventsService.deleteImage(eventId, req.user);
  }
}
