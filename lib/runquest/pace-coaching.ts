import { haversineMeters } from "@/lib/runquest/engine";
import type { PaceCoachState, PaceZone, PaceZoneSummary, RoutePoint } from "@/lib/runquest/types";

const WINDOW_MS = 60_000;
const MIN_WINDOW_MS = 15_000;
const MIN_DISTANCE_METERS = 45;
const CUE_INTERVAL_MS = 90_000;
const MAX_SUMMARY_SEGMENT_MS = 120_000;
const MIN_SUMMARY_SEGMENT_METERS = 3;
const MAX_SUMMARY_SPEED_METERS_PER_SECOND = 13;

const ZONE_COPY: Record<PaceZone, string> = {
  SETTLING: "Let the route settle before chasing a rhythm.",
  EASY: "Easy field pace — keep the effort comfortable and conversational.",
  STEADY: "Steady field pace — smooth, repeatable, and ready for more ground.",
  BRISK: "Brisk field pace — stay relaxed and check your surroundings.",
  SWIFT: "Swift field pace — protect your form and choose comfort over speed.",
};

export const DEFAULT_PACE_COACH_STATE: PaceCoachState = {
  zone: "SETTLING",
  paceSecondsPerKm: null,
  message: ZONE_COPY.SETTLING,
  lastCueAt: null,
  lastCuedZone: null,
};

export function paceZoneForSpeed(speedMetersPerSecond: number): PaceZone {
  if (speedMetersPerSecond < 2.2) return "EASY";
  if (speedMetersPerSecond < 3.1) return "STEADY";
  if (speedMetersPerSecond < 4.2) return "BRISK";
  return "SWIFT";
}

function getRecentRouteWindow(route: RoutePoint[]): RoutePoint[] {
  const latest = route.at(-1);
  if (!latest) return [];
  const minimumTimestamp = latest.timestamp - WINDOW_MS;
  return route.filter((point) => point.timestamp >= minimumTimestamp);
}

export type PaceCoachingEvaluation = {
  state: PaceCoachState;
  shouldCue: boolean;
};

export function canPlayPaceCoachingCue(
  paceCoachingEnabled: boolean,
  paceCoachingHapticsEnabled: boolean,
  hapticsEnabled: boolean,
  reduceMotion: boolean,
): boolean {
  return paceCoachingEnabled && paceCoachingHapticsEnabled && hapticsEnabled && !reduceMotion;
}

/**
 * Derives a private rolling pace from already accepted foreground GPS samples.
 * It intentionally waits for a minimum time and distance window, and never
 * prompts for a zone transition more than once every ninety seconds.
 */
export function evaluatePaceCoaching(
  route: RoutePoint[],
  previous: PaceCoachState,
): PaceCoachingEvaluation {
  const window = getRecentRouteWindow(route);
  const first = window[0];
  const latest = window.at(-1);
  if (!first || !latest) return { state: previous, shouldCue: false };

  const elapsedMs = latest.timestamp - first.timestamp;
  let distanceMeters = 0;
  for (let index = 1; index < window.length; index += 1) {
    distanceMeters += haversineMeters(window[index - 1], window[index]);
  }

  if (elapsedMs < MIN_WINDOW_MS || distanceMeters < MIN_DISTANCE_METERS) {
    const state = previous.zone === "SETTLING" ? previous : { ...DEFAULT_PACE_COACH_STATE };
    return { state, shouldCue: false };
  }

  const speedMetersPerSecond = distanceMeters / (elapsedMs / 1_000);
  const zone = paceZoneForSpeed(speedMetersPerSecond);
  const zoneChanged = zone !== previous.zone;
  const cueAllowed = zoneChanged
    && previous.lastCuedZone !== zone
    && (previous.lastCueAt === null || latest.timestamp - previous.lastCueAt >= CUE_INTERVAL_MS);
  const state: PaceCoachState = {
    zone,
    paceSecondsPerKm: Math.round(1_000 / speedMetersPerSecond),
    message: ZONE_COPY[zone],
    lastCueAt: cueAllowed ? latest.timestamp : previous.lastCueAt,
    lastCuedZone: cueAllowed ? zone : previous.lastCuedZone,
  };
  return { state, shouldCue: cueAllowed };
}

export function formatPaceCoachLabel(paceSecondsPerKm: number | null): string {
  if (!paceSecondsPerKm || !Number.isFinite(paceSecondsPerKm)) return "Finding rhythm";
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = paceSecondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} / km`;
}

export const EMPTY_PACE_ZONE_SUMMARY: PaceZoneSummary = {
  easySeconds: 0,
  steadySeconds: 0,
  briskSeconds: 0,
  swiftSeconds: 0,
  analyzedSeconds: 0,
  excludedSeconds: 0,
};

/**
 * Assigns each accepted route segment to a pace zone. Long gaps, very short
 * movement, invalid timestamps, and implausible speeds are excluded so a pause
 * or sparse GPS sample cannot become invented performance time.
 */
export function summarizePaceZones(route: RoutePoint[]): PaceZoneSummary {
  const summary = { ...EMPTY_PACE_ZONE_SUMMARY };
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const current = route[index];
    const elapsedMs = current.timestamp - previous.timestamp;
    const elapsedSeconds = Math.round(elapsedMs / 1_000);
    if (elapsedSeconds <= 0) continue;
    const distanceMeters = haversineMeters(previous, current);
    const speedMetersPerSecond = distanceMeters / (elapsedMs / 1_000);
    if (elapsedMs > MAX_SUMMARY_SEGMENT_MS || distanceMeters < MIN_SUMMARY_SEGMENT_METERS || speedMetersPerSecond > MAX_SUMMARY_SPEED_METERS_PER_SECOND) {
      summary.excludedSeconds += elapsedSeconds;
      continue;
    }
    const zone = paceZoneForSpeed(speedMetersPerSecond);
    if (zone === "EASY") summary.easySeconds += elapsedSeconds;
    if (zone === "STEADY") summary.steadySeconds += elapsedSeconds;
    if (zone === "BRISK") summary.briskSeconds += elapsedSeconds;
    if (zone === "SWIFT") summary.swiftSeconds += elapsedSeconds;
    summary.analyzedSeconds += elapsedSeconds;
  }
  return summary;
}

export function formatZoneDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}
