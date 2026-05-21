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

/**
 * Haversine distance in km between a search point and event.location.
 * Event point uses PostgreSQL (x, y) = (longitude, latitude).
 */
export const EVENT_DISTANCE_KM_SQL = `6371 * 2 * ASIN(SQRT(
  POWER(SIN((RADIANS((event.location)[1]) - RADIANS(:lat)) / 2), 2) +
  COS(RADIANS(:lat)) * COS(RADIANS((event.location)[1])) *
  POWER(SIN((RADIANS((event.location)[0]) - RADIANS(:lng)) / 2), 2)
))`;

/**
 * True when :userIdText (varchar) appears in event.participants.
 * Use a separate param from :userId so TypeORM does not bind uuid for text comparison.
 */
export const EVENT_USER_IS_PARTICIPANT_SQL = `EXISTS (
  SELECT 1 FROM jsonb_array_elements(COALESCE(event.participants::jsonb, '[]'::jsonb)) AS team
  WHERE (
    jsonb_typeof(team) = 'array' AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(team) AS uid WHERE uid = :userIdText
    )
  ) OR (
    jsonb_typeof(team) = 'object' AND team ? 'userIds' AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(team->'userIds') AS uid WHERE uid = :userIdText
    )
  )
)`;
