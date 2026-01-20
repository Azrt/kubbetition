import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from 'src/users/entities/user.entity';
import { Game } from 'src/games/entities/game.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { StartRoundDto } from './dto/start-round.dto';
import { GameType } from 'src/common/enums/gameType';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
  ) {}

  async create(createEventDto: CreateEventDto, currentUser: User): Promise<Event> {
    const { participants, gameType, rounds, startTime, ...rest } = createEventDto;

    // Validate participants structure matches game type
    const teamSize = gameType;
    for (const team of participants) {
      if (team.length !== teamSize) {
        throw new BadRequestException(
          `Each team must have exactly ${teamSize} participants for ${gameType}v${gameType} game type`,
        );
      }
    }

    // Validate all participants exist
    const allParticipantIds = participants.flat();
    const uniqueParticipantIds = [...new Set(allParticipantIds)];
    const existingUsers = await this.usersRepository.findBy({
      id: In(uniqueParticipantIds),
    });

    if (existingUsers.length !== uniqueParticipantIds.length) {
      const foundIds = existingUsers.map((u) => u.id);
      const missingIds = uniqueParticipantIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Participants with IDs ${missingIds.join(', ')} do not exist`,
      );
    }

    // Validate minimum number of teams (at least 2)
    if (participants.length < 2) {
      throw new BadRequestException('At least 2 teams are required for an event');
    }

    const event = this.eventsRepository.create({
      ...rest,
      participants,
      gameType,
      rounds,
      currentRound: 0,
      startTime: new Date(startTime),
      createdBy: currentUser,
    });

    return this.eventsRepository.save(event);
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
          event.participants,
          previousGames,
          event.gameType,
        )
      : this.generateMatchups(
          event.participants,
          previousGames,
          event.gameType,
        );

    // Load all users
    const allParticipantIds = event.participants.flat();
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

  async findOne(id: number): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'games'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findAll(): Promise<Event[]> {
    return this.eventsRepository.find({
      relations: ['createdBy', 'games'],
    });
  }
}
