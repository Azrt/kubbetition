import { EventMode } from './enums/event-mode.enum';

export const MAX_EVENT_PARTICIPANT_LIMIT = 20;
export const MIN_EVENT_PARTICIPANT_LIMIT = 2;

/** Round-robin rounds needed so every team can play every other team once. */
export function computeRoundRobinRounds(teamCount: number): number {
  if (teamCount < 2) {
    return 1;
  }
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
}

export function usesRankingMatchmaking(mode: EventMode): boolean {
  return mode === EventMode.Tournament;
}
