import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event as EventEntity } from './entities/event.entity';
import { User } from 'src/users/entities/user.entity';
import { Game } from 'src/games/entities/game.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { StartRoundDto } from './dto/start-round.dto';
import { GameType } from 'src/common/enums/gameType';
import { isAdminRole } from 'src/common/helpers/user';
import { UpdateEventDto } from './dto/update-event.dto';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { FriendRequestStatus } from 'src/users/enums/friend-request-status.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private eventsRepository: Repository<EventEntity>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(FriendRequest)
    private friendRequestsRepository: Repository<FriendRequest>,
  ) {}

  private isParticipant(event: EventEntity, userId: number): boolean {
    const teams = event.participants || [];
    return teams.some((team) => Array.isArray(team) && team.includes(userId));
  }

  async join(eventId: number, team: number[], currentUser: User): Promise<EventEntity> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['createdBy', 'games'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // No joining once games started (currentRound > 0)
    if ((event.currentRound ?? 0) > 0) {
      throw new BadRequestException('Cannot join: event already started');
    }

    const now = new Date();
    const joinDeadline = event.joiningTime ?? event.startTime;
    if (joinDeadline && now.getTime() > new Date(joinDeadline).getTime()) {
      throw new BadRequestException('Cannot join: joining time has passed');
    }

    if (team.length === 0) {
      throw new BadRequestException('Team cannot be empty');
    }

    // Load current user with team and members relation
    const userWithTeam = await this.usersRepository.findOne({
      where: { id: currentUser.id },
      relations: ['team', 'team.members'],
    });

    // Get all accepted friend requests where user is either requester or recipient
    const friendRequests = await this.friendRequestsRepository.find({
      where: [
        {
          status: FriendRequestStatus.ACCEPTED,
          requester: { id: currentUser.id },
        },
        {
          status: FriendRequestStatus.ACCEPTED,
          recipient: { id: currentUser.id },
        },
      ],
      relations: ['requester', 'recipient'],
    });

    // Extract friend user IDs from friend requests
    const friendIds = new Set<number>();
    for (const request of friendRequests) {
      if (request.requester.id === currentUser.id) {
        friendIds.add(request.recipient.id);
      } else {
        friendIds.add(request.requester.id);
      }
    }

    // Get team member IDs (excluding current user)
    const teamMemberIds = new Set<number>();
    if (userWithTeam?.team?.members) {
      for (const member of userWithTeam.team.members) {
        if (member.id !== currentUser.id) {
          teamMemberIds.add(member.id);
        }
      }
    }

    // Combine friends and team members into one set
    const allowedUserIds = new Set([...friendIds, ...teamMemberIds]);

    // Validate that all team members (excluding current user) are either friends or team members
    const otherTeamMembers = team.filter((teamMember) => teamMember !== currentUser.id);
    const invalidMembers = otherTeamMembers.filter((memberId) => !allowedUserIds.has(memberId));

    if (invalidMembers.length > 0) {
      throw new BadRequestException(
        `Team members with IDs ${invalidMembers.join(', ')} must be friends or team members`,
      );
    }

    if (event.participants?.some((participant) => participant.some((member) => team.includes(member)))) {
      throw new BadRequestException('Team members already participating in this event');
    }

    // Validate team size
    if (!Array.isArray(team) || team.length !== event.gameType) {
      throw new BadRequestException(
        `Team must have exactly ${event.gameType} participants for ${event.gameType}v${event.gameType} game type`,
      );
    }

    const uniqueTeamIds = [...new Set(team)];
    if (uniqueTeamIds.length !== team.length) {
      throw new BadRequestException('Team cannot contain duplicate user IDs');
    }

    // Validate users exist
    const users = await this.usersRepository.findBy({ id: In(uniqueTeamIds) });
    if (users.length !== uniqueTeamIds.length) {
      const foundIds = users.map((u) => u.id);
      const missingIds = uniqueTeamIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Participants with IDs ${missingIds.join(', ')} do not exist`);
    }

    // Prevent users already in event from joining again
    const existingIds = new Set((event.participants || []).flat());
    const duplicates = uniqueTeamIds.filter((id) => existingIds.has(id));
    if (duplicates.length) {
      throw new BadRequestException(
        `Users already participating in this event: ${duplicates.join(', ')}`,
      );
    }

    event.participants = [...(event.participants || []), uniqueTeamIds];
    return this.eventsRepository.save(event);
  }

  async update(eventId: number, updateEventDto: UpdateEventDto, currentUser: User): Promise<EventEntity> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['createdBy', 'games'],
    });
    
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    if (event.createdBy.id !== currentUser.id && !isAdminRole(currentUser)) {
      throw new ForbiddenException('Only the event creator can update the event');
    }

    const updatedEvent = this.eventsRepository.create({
      ...event,
      ...updateEventDto,
    });

    try {
      updatedEvent.joiningTime = updateEventDto.joiningTime ? new Date(updateEventDto.joiningTime) : event.joiningTime;
    } catch (error) {
      throw new BadRequestException('Invalid joiningTime');
    }

    try {
      updatedEvent.startTime = updateEventDto.startTime ? new Date(updateEventDto.startTime) : event.startTime;
    } catch (error) {
      throw new BadRequestException('Invalid startTime');
    }

    return this.eventsRepository.save(updatedEvent);
  }

  async create(createEventDto: CreateEventDto, currentUser: User): Promise<EventEntity> {
    const { gameType, rounds, startTime, joiningTime, isPublic, ...rest } = createEventDto as any;

    const start = new Date(startTime);
    const joining = joiningTime ? new Date(joiningTime) : null;
    if (joining && joining.getTime() > start.getTime()) {
      throw new BadRequestException('joiningTime must be less than or equal to startTime');
    }

    const event = this.eventsRepository.create({
      ...rest,
      // By default event starts with no participants; participants can only join via /events/:id/join.
      participants: [],
      isPublic: isPublic ?? true,
      gameType,
      rounds,
      currentRound: 0,
      joiningTime: joining,
      startTime: start,
      createdBy: currentUser,
    });

    const savedEvent = await this.eventsRepository.save(event);
    return Array.isArray(savedEvent) ? savedEvent[0] : savedEvent;
  }

  async startRound(eventId: number, startRoundDto: StartRoundDto, currentUser: User): Promise<Game[]> {
    const { roundNumber } = startRoundDto;

    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['createdBy', 'games', 'games.team1Members', 'games.team2Members'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Verify current user is the event creator
    if (event.createdBy.id !== currentUser.id) {
      throw new ForbiddenException('Only the event creator can start rounds');
    }

    // Validate round number
    if (roundNumber < 1 || roundNumber > event.rounds) {
      throw new BadRequestException(
        `Round number must be between 1 and ${event.rounds}`,
      );
    }

    // Check if round has already been started by checking if games exist for this round
    const existingGamesForRound = event.games?.filter((game) => game.round === roundNumber);
    if (existingGamesForRound && existingGamesForRound.length > 0) {
      throw new BadRequestException(
        `Round ${roundNumber} has already been started`,
      );
    }

    // Validate that rounds are started sequentially
    if (roundNumber !== event.currentRound + 1) {
      throw new BadRequestException(
        `Rounds must be started sequentially. Next round to start is ${event.currentRound + 1}`,
      );
    }

    // Validate participants exist and match game type before starting round
    const participants = event.participants || [];
    if (participants.length < 2) {
      throw new BadRequestException('At least 2 teams are required for an event');
    }
    const teamSize = event.gameType;
    for (const team of participants) {
      if (!Array.isArray(team) || team.length !== teamSize) {
        throw new BadRequestException(
          `Each team must have exactly ${teamSize} participants for ${teamSize}v${teamSize} game type`,
        );
      }
    }
    const allIds = participants.flat();
    const uniqueIds = [...new Set(allIds)];
    const existingUsers = await this.usersRepository.findBy({ id: In(uniqueIds) });
    if (existingUsers.length !== uniqueIds.length) {
      const foundIds = existingUsers.map((u) => u.id);
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Participants with IDs ${missingIds.join(', ')} do not exist`);
    }

    // Update current round
    event.currentRound = roundNumber;
    await this.eventsRepository.save(event);

    // Get previous games (completed games from previous rounds)
    const previousGames = (event.games || []).filter(
      (game) => game.round !== null && game.round < roundNumber && game.team1Score !== null && game.team2Score !== null,
    );

    // Generate matchups - use tournament mode if enabled and not round 1
    const matchups = event.tournamentMode && roundNumber > 1
      ? this.generateTournamentMatchups(
          participants,
          previousGames,
          event.gameType,
        )
      : this.generateMatchups(
          participants,
          previousGames,
          event.gameType,
        );

    // Load all users
    const allParticipantIds = participants.flat();
    const users = await this.usersRepository.findBy({
      id: In(allParticipantIds),
    });
    const usersMap = new Map(users.map((u) => [u.id, u]));

    // Determine game duration - use event.roundDuration or default to 20
    const gameDuration = event.roundDuration ?? 20;

    // Create games for each matchup
    const games: Game[] = [];
    for (const matchup of matchups) {
      const [team1Ids, team2Ids] = matchup;
      const team1Members = team1Ids.map((id) => usersMap.get(id)).filter(Boolean);
      const team2Members = team2Ids.map((id) => usersMap.get(id)).filter(Boolean);

      if (team1Members.length !== team1Ids.length || team2Members.length !== team2Ids.length) {
        throw new BadRequestException('Some participants not found');
      }

      const game = this.gamesRepository.create({
        type: event.gameType,
        duration: gameDuration,
        team1Members,
        team2Members,
        participants: [...team1Members, ...team2Members],
        event,
        round: roundNumber,
        createdBy: currentUser,
        team1Score: null,
        team2Score: null,
        team1Ready: false,
        team2Ready: false,
        isCancelled: false,
        startTime: null,
        endTime: null,
      });

      const savedGame = await this.gamesRepository.save(game);
      games.push(savedGame);
    }

    return games;
  }

  /**
   * Calculate team statistics from previous games
   */
  private calculateTeamStats(
    team: Array<number>,
    previousGames: Game[],
  ): {
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    winRecord: number; // wins - losses
    pointDifferential: number; // pointsFor - pointsAgainst
  } {
    let wins = 0;
    let losses = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    // Helper to check if two teams are exactly the same
    const areTeamsEqual = (team1: Array<number>, team2: Array<number>): boolean => {
      if (team1.length !== team2.length) return false;
      const sorted1 = [...team1].sort();
      const sorted2 = [...team2].sort();
      return sorted1.every((id, idx) => id === sorted2[idx]);
    };

    for (const game of previousGames) {
      if (!game.team1Members || !game.team2Members || game.team1Score === null || game.team2Score === null) {
        continue;
      }

      const team1Ids = game.team1Members.map((u) => u.id);
      const team2Ids = game.team2Members.map((u) => u.id);

      // Check if this team matches team1
      const isTeam1 = areTeamsEqual(team, team1Ids);
      const isTeam2 = areTeamsEqual(team, team2Ids);

      if (isTeam1) {
        pointsFor += game.team1Score;
        pointsAgainst += game.team2Score;
        if (game.team1Score > game.team2Score) {
          wins++;
        } else if (game.team1Score < game.team2Score) {
          losses++;
        }
      } else if (isTeam2) {
        pointsFor += game.team2Score;
        pointsAgainst += game.team1Score;
        if (game.team2Score > game.team1Score) {
          wins++;
        } else if (game.team2Score < game.team1Score) {
          losses++;
        }
      }
    }

    return {
      wins,
      losses,
      pointsFor,
      pointsAgainst,
      winRecord: wins - losses,
      pointDifferential: pointsFor - pointsAgainst,
    };
  }

  /**
   * Generate tournament-style matchups based on team performance
   * Teams are ranked by win record, then by point differential
   * Similar-ranked teams are matched together (Swiss-style)
   */
  private generateTournamentMatchups(
    participants: Array<Array<number>>,
    previousGames: Game[],
    gameType: GameType,
  ): Array<[Array<number>, Array<number>]> {
    const matchups: Array<[Array<number>, Array<number>]> = [];

    // Calculate statistics for each team
    interface TeamWithStats {
      team: Array<number>;
      stats: ReturnType<typeof this.calculateTeamStats>;
      index: number;
    }

    const teamsWithStats: TeamWithStats[] = participants.map((team, index) => ({
      team,
      stats: this.calculateTeamStats(team, previousGames),
      index,
    }));

    // Sort teams by ranking (win record desc, then point differential desc)
    teamsWithStats.sort((a, b) => {
      // Primary sort: win record
      if (a.stats.winRecord !== b.stats.winRecord) {
        return b.stats.winRecord - a.stats.winRecord;
      }
      // Secondary sort: point differential
      if (a.stats.pointDifferential !== b.stats.pointDifferential) {
        return b.stats.pointDifferential - a.stats.pointDifferential;
      }
      // Tertiary sort: points for
      return b.stats.pointsFor - a.stats.pointsFor;
    });

    // Build a map of previous matchups
    const previousMatchups = new Set<string>();
    for (const game of previousGames) {
      if (game.team1Members && game.team2Members) {
        const team1Ids = game.team1Members.map((u) => u.id).sort().join(',');
        const team2Ids = game.team2Members.map((u) => u.id).sort().join(',');
        previousMatchups.add(`${team1Ids}|${team2Ids}`);
        previousMatchups.add(`${team2Ids}|${team1Ids}`);
      }
    }

    const getMatchupKey = (team1: Array<number>, team2: Array<number>): string => {
      const team1Sorted = [...team1].sort().join(',');
      const team2Sorted = [...team2].sort().join(',');
      return `${team1Sorted}|${team2Sorted}`;
    };

    const havePlayedBefore = (team1: Array<number>, team2: Array<number>): boolean => {
      return previousMatchups.has(getMatchupKey(team1, team2));
    };

    // Match teams with similar rankings, avoiding duplicates where possible
    const remainingTeams = [...teamsWithStats];

    while (remainingTeams.length > 1) {
      // Try to find best available opponent for the first team
      let bestOpponentIndex: number | null = null;
      const currentTeam = remainingTeams[0];

      // Look for an opponent with similar ranking (preferably same win record)
      for (let i = 1; i < remainingTeams.length; i++) {
        const opponent = remainingTeams[i];

        // Prefer opponents with same win record
        const sameWinRecord = opponent.stats.winRecord === currentTeam.stats.winRecord;
        const notPlayedBefore = !havePlayedBefore(currentTeam.team, opponent.team);

        // Priority: same win record + haven't played before
        if (sameWinRecord && notPlayedBefore) {
          bestOpponentIndex = i;
          break;
        }

        // Fallback: haven't played before
        if (!bestOpponentIndex && notPlayedBefore) {
          bestOpponentIndex = i;
        }

        // Last resort: any opponent
        if (!bestOpponentIndex && i === 1) {
          bestOpponentIndex = i;
        }
      }

      if (bestOpponentIndex === null) {
        // Should not happen, but handle edge case
        break;
      }

      const opponent = remainingTeams[bestOpponentIndex];
      matchups.push([currentTeam.team, opponent.team]);

      // Remove matched teams (remove higher index first)
      remainingTeams.splice(bestOpponentIndex, 1);
      remainingTeams.splice(0, 1);
    }

    // If there's one team left with odd number of teams, it sits out this round
    if (remainingTeams.length === 1) {
      // Optional: log or handle the bye
    }

    return matchups;
  }

  /**
   * Generate matchups for a round, avoiding duplicate matchups where possible
   * Used for round 1 or non-tournament mode
   * @param participants Array of participant teams (each team is an array of user IDs)
   * @param previousGames Previous games played in this event
   * @param gameType The game type (team size)
   * @returns Array of matchups, where each matchup is [team1, team2]
   */
  private generateMatchups(
    participants: Array<Array<number>>,
    previousGames: Game[],
    gameType: GameType,
  ): Array<[Array<number>, Array<number>]> {
    const matchups: Array<[Array<number>, Array<number>]> = [];

    // Build a map of previous matchups
    const previousMatchups = new Set<string>();
    for (const game of previousGames) {
      if (game.team1Members && game.team2Members) {
        const team1Ids = game.team1Members.map((u) => u.id).sort().join(',');
        const team2Ids = game.team2Members.map((u) => u.id).sort().join(',');
        // Store both directions (team1 vs team2 and team2 vs team1)
        previousMatchups.add(`${team1Ids}|${team2Ids}`);
        previousMatchups.add(`${team2Ids}|${team1Ids}`);
      }
    }

    // Helper function to create matchup key
    const getMatchupKey = (team1: Array<number>, team2: Array<number>): string => {
      const team1Sorted = [...team1].sort().join(',');
      const team2Sorted = [...team2].sort().join(',');
      return `${team1Sorted}|${team2Sorted}`;
    };

    // Helper function to check if teams have played before
    const havePlayedBefore = (team1: Array<number>, team2: Array<number>): boolean => {
      return previousMatchups.has(getMatchupKey(team1, team2));
    };

    // Create a copy of participants to work with
    const remainingTeams = [...participants];

    while (remainingTeams.length > 1) {
      let bestMatchup: {
        team1Index: number;
        team2Index: number;
        isDuplicate: boolean;
      } | null = null;

      // Find the best matchup (preferably non-duplicate)
      for (let i = 0; i < remainingTeams.length; i++) {
        for (let j = i + 1; j < remainingTeams.length; j++) {
          const team1 = remainingTeams[i];
          const team2 = remainingTeams[j];
          const isDuplicate = havePlayedBefore(team1, team2);

          // If we find a non-duplicate matchup, use it immediately
          if (!isDuplicate) {
            bestMatchup = {
              team1Index: i,
              team2Index: j,
              isDuplicate: false,
            };
            break;
          }

          // Otherwise, remember this as a fallback if we don't have one yet
          if (!bestMatchup) {
            bestMatchup = {
              team1Index: i,
              team2Index: j,
              isDuplicate: true,
            };
          }
        }

        // If we found a non-duplicate, stop searching
        if (bestMatchup && !bestMatchup.isDuplicate) {
          break;
        }
      }

      if (!bestMatchup) {
        // Should not happen, but handle edge case
        break;
      }

      // Create the matchup
      const team1 = remainingTeams[bestMatchup.team1Index];
      const team2 = remainingTeams[bestMatchup.team2Index];
      matchups.push([team1, team2]);

      // Remove matched teams (remove higher index first to maintain indices)
      const indicesToRemove = [bestMatchup.team1Index, bestMatchup.team2Index].sort(
        (a, b) => b - a,
      );
      for (const index of indicesToRemove) {
        remainingTeams.splice(index, 1);
      }
    }

    // If there's one team left and odd number of teams, it sits out this round
    if (remainingTeams.length === 1) {
      // Optional: log or handle the bye
    }

    return matchups;
  }

  async findOne(id: number): Promise<EventEntity> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'games'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findOneVisible(id: number, currentUser: User): Promise<EventEntity> {
    const event = await this.findOne(id);
    if (event.isPublic) return event;
    if (isAdminRole(currentUser)) return event;
    if (this.isParticipant(event, currentUser.id)) return event;
    throw new ForbiddenException('You are not allowed to access this event');
  }

  async findAllVisible(currentUser: User): Promise<EventEntity[]> {
    const events = await this.eventsRepository.find({
      relations: ['createdBy', 'games'],
    });

    if (isAdminRole(currentUser)) return events;
    return events.filter((e) => e.isPublic || this.isParticipant(e, currentUser.id));
  }

  async endRound(eventId: number, currentUser: User): Promise<Game[]> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['createdBy', 'games'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Verify current user is admin, superadmin, or event creator
    const isAuthorized = 
      event.createdBy.id === currentUser.id || 
      isAdminRole(currentUser);
    
    if (!isAuthorized) {
      throw new ForbiddenException('Only admin, superadmin, or event creator can end rounds');
    }

    // Check if there's an active round
    if (event.currentRound === 0 || event.currentRound === null) {
      throw new BadRequestException('No active round to end');
    }

    // Get all games for the current round
    const currentRoundGames = (event.games || []).filter(
      (game) => game.round === event.currentRound && !game.isCancelled,
    );

    if (currentRoundGames.length === 0) {
      throw new BadRequestException(`No games found for round ${event.currentRound}`);
    }

    const now = new Date();

    // Update all games: set endTime, startTime (if null), ready flags, and null scores to 0
    for (const game of currentRoundGames) {
      game.endTime = now;
      if (!game.startTime) {
        game.startTime = now;
      }
      game.team1Ready = true;
      game.team2Ready = true;
      if (game.team1Score === null) {
        game.team1Score = 0;
      }
      if (game.team2Score === null) {
        game.team2Score = 0;
      }
    }

    // Save all updated games
    const savedGames = await this.gamesRepository.save(currentRoundGames);
    return savedGames;
  }

  async getActiveGames(eventId: number, currentUser: User): Promise<Game[]> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['createdBy', 'games', 'games.team1Members', 'games.team2Members'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check visibility
    if (!event.isPublic && !isAdminRole(currentUser) && !this.isParticipant(event, currentUser.id)) {
      throw new ForbiddenException('You are not allowed to access this event');
    }

    // Active games are games from the current round that haven't ended (endTime is null)
    const activeGames = (event.games || []).filter(
      (game) => 
        game.round === event.currentRound && 
        !game.isCancelled && 
        game.endTime === null,
    );

    return activeGames;
  }

  async leave(eventId: number, currentUser: User): Promise<EventEntity> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['createdBy', 'games'],
    });
    
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (!this.isParticipant(event, currentUser.id) && !isAdminRole(currentUser)) {
      throw new ForbiddenException('You are not a participant of this event');
    }

    event.participants = event.participants?.filter((team) => !team.includes(currentUser.id));
    return this.eventsRepository.save(event);
  }
}
