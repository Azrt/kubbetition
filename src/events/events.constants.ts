/** Default search radius (km) when lat/lng are provided without radiusKm. */
export const NEARBY_EVENTS_DEFAULT_RADIUS_KM = 10;

export const NEARBY_EVENTS_MIN_RADIUS_KM = 1;

export const NEARBY_EVENTS_MAX_RADIUS_KM = 300;

export const EVENTS_DEFAULT_PAGE_LIMIT = 20;

export const EVENTS_MAX_PAGE_LIMIT = 50;

/** TTL for cached GET /events/me responses when limit is set (5 minutes). */
export const MY_EVENTS_CACHE_TTL = 300_000;
