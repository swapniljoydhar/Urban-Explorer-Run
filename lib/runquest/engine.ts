import {
  PROGRESSION_RULESET_VERSION,
  TILE_ENCODER_VERSION,
  type ActiveExpedition,
  type DiscoveryOutcome,
  type RoutePoint,
  type TileRecord,
} from "@/lib/runquest/types";

const EARTH_RADIUS_METERS = 6_371_000;
const HEX_RADIUS_METERS = 75;
const MAX_SEGMENT_METERS = 450;

export function haversineMeters(a: RoutePoint, b: RoutePoint): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const startLatitude = toRadians(a.latitude);
  const endLatitude = toRadians(b.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.max(0, 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine))));
}

function roundAxial(q: number, r: number): { q: number; r: number } {
  const x = q;
  const z = r;
  const y = -x - z;
  let rx = Math.round(x);
  const ry = Math.round(y);
  let rz = Math.round(z);
  const xDifference = Math.abs(rx - x);
  const yDifference = Math.abs(ry - y);
  const zDifference = Math.abs(rz - z);

  if (xDifference > yDifference && xDifference > zDifference) {
    rx = -ry - rz;
  } else if (zDifference > yDifference) {
    rz = -rx - ry;
  }
  return { q: rx, r: rz };
}

/**
 * A deterministic local hex encoder used by the rebuilt v1 app. The explicit
 * version prefix prevents a future H3 migration from silently changing old map
 * identities. It intentionally produces one stable ID for the same coordinate.
 */
export function encodeHexGridV1(latitude: number, longitude: number): string {
  const metersPerLatitudeDegree = 111_320;
  const metersPerLongitudeDegree = Math.max(1, metersPerLatitudeDegree * Math.cos((latitude * Math.PI) / 180));
  const x = longitude * metersPerLongitudeDegree;
  const y = latitude * metersPerLatitudeDegree;
  const q = (Math.sqrt(3) / 3 * x - y / 3) / HEX_RADIUS_METERS;
  const r = ((2 / 3) * y) / HEX_RADIUS_METERS;
  const rounded = roundAxial(q, r);
  return `rq:${TILE_ENCODER_VERSION}:${rounded.q}:${rounded.r}`;
}

export function calculateXp(distanceMeters: number, newTileCount: number): number {
  const distanceXp = Math.max(0, distanceMeters) / 1_000 * 120;
  const tileXp = Math.max(0, newTileCount) * 50;
  return Math.round(distanceXp + tileXp);
}

export function calculateLevel(totalXp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, totalXp) / 200)) + 1);
}

export function levelProgress(totalXp: number): { currentLevel: number; currentFloor: number; nextFloor: number; progress: number } {
  const currentLevel = calculateLevel(totalXp);
  const currentFloor = (currentLevel - 1) ** 2 * 200;
  const nextFloor = currentLevel ** 2 * 200;
  const progress = Math.min(1, Math.max(0, (totalXp - currentFloor) / Math.max(1, nextFloor - currentFloor)));
  return { currentLevel, currentFloor, nextFloor, progress };
}

export function processLocationSample(
  expedition: ActiveExpedition,
  tiles: Record<string, TileRecord>,
  nextPoint: RoutePoint,
): DiscoveryOutcome {
  if (nextPoint.accuracy !== null && nextPoint.accuracy > 75) {
    return {
      nextExpedition: { ...expedition, notice: "Location confidence is low — map rewards are paused." },
      nextTiles: tiles,
      xpGained: 0,
      discoveredTileId: null,
    };
  }

  const route = expedition.route.length >= 250 ? expedition.route.slice(-249) : expedition.route;
  const rawSegment = expedition.lastPoint ? haversineMeters(expedition.lastPoint, nextPoint) : 0;
  const segmentMeters = rawSegment > MAX_SEGMENT_METERS ? 0 : rawSegment;
  const tileId = encodeHexGridV1(nextPoint.latitude, nextPoint.longitude);
  const existingTile = tiles[tileId];
  const isNewTile = !existingTile;
  const now = nextPoint.timestamp;

  const nextTiles = isNewTile
    ? {
        ...tiles,
        [tileId]: {
          id: tileId,
          encoderVersion: TILE_ENCODER_VERSION,
          firstVisitedAt: now,
          lastVisitedAt: now,
          visitCount: 1,
          mastery: "SEEN" as const,
        },
      }
    : {
        ...tiles,
        [tileId]: {
        ...existingTile,
        lastVisitedAt: now,
        visitCount: existingTile.visitCount + 1,
          mastery: (existingTile.visitCount >= 2 ? "MASTERED" : "MAPPED") as TileRecord["mastery"],
        },
      };

  const xpGained = calculateXp(segmentMeters, isNewTile ? 1 : 0);
  const discoveryMessage = isNewTile ? "New map cell discovered +50 XP" : segmentMeters > 0 ? "Route recorded" : "Position anchored";

  return {
    nextExpedition: {
      ...expedition,
      distanceMeters: expedition.distanceMeters + segmentMeters,
      xpEarned: expedition.xpEarned + xpGained,
      newTileIds: isNewTile ? [...expedition.newTileIds, tileId] : expedition.newTileIds,
      route: [...route, nextPoint],
      lastPoint: nextPoint,
      notice: discoveryMessage,
    },
    nextTiles,
    xpGained,
    discoveredTileId: isNewTile ? tileId : null,
  };
}

export function createDemoPoint(sequence: number): RoutePoint {
  const latitude = 37.7749 + Math.sin(sequence * 0.8) * 0.0014 + sequence * 0.00011;
  const longitude = -122.4194 + Math.cos(sequence * 0.65) * 0.0012 + sequence * 0.00008;
  return { latitude, longitude, timestamp: Date.now(), accuracy: 12 };
}

export function createWorkoutId(startedAt: number): string {
  return `rq-workout-${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
}

export const currentRuleset = PROGRESSION_RULESET_VERSION;
