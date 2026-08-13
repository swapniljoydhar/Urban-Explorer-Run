import { RUNQUEST_STATE_VERSION, type RunQuestState } from "@/lib/runquest/types";
import { DEFAULT_RUNQUEST_STATE } from "@/lib/runquest/persistence-defaults";
import { z } from "zod";

const finiteNumber = z.number().finite();
const routePointSchema = z.object({
  latitude: finiteNumber.min(-90).max(90),
  longitude: finiteNumber.min(-180).max(180),
  timestamp: finiteNumber.nonnegative(),
  accuracy: finiteNumber.nonnegative().nullable(),
});
const tileSchema = z.object({
  id: z.string().min(1).max(160),
  encoderVersion: z.literal("hex-grid-v1"),
  latitude: finiteNumber.min(-90).max(90).optional(),
  longitude: finiteNumber.min(-180).max(180).optional(),
  firstVisitedAt: finiteNumber.nonnegative(),
  lastVisitedAt: finiteNumber.nonnegative(),
  visitCount: z.number().int().nonnegative().max(10_000),
  mastery: z.enum(["SEEN", "MAPPED", "MASTERED"]),
});
const workoutSchema = z.object({
  id: z.string().min(1).max(160),
  startedAt: finiteNumber.nonnegative(),
  endedAt: finiteNumber.nonnegative(),
  mode: z.enum(["live", "demo"]),
  distanceMeters: finiteNumber.nonnegative().max(1_000_000),
  steps: z.number().int().nonnegative().max(10_000_000),
  xpEarned: z.number().int().nonnegative().max(10_000_000),
  newTileCount: z.number().int().nonnegative().max(10_000),
  contractRewardXp: z.number().int().nonnegative().max(10_000).optional(),
  route: z.array(routePointSchema).max(250),
  rulesetVersion: z.literal("rq-progression-v1"),
});
const persistedStateSchema = z.object({
  profile: z.object({
    totalXp: z.number().int().nonnegative().max(10_000_000).optional(),
    title: z.string().max(64).optional(),
    badges: z.array(z.string().max(64)).max(100).optional(),
    completedContractClaims: z.array(z.string().max(64)).max(366).optional(),
    achievements: z.array(z.object({
      id: z.enum(["FIRST_MARK", "FRONTIER_FINDER", "LONG_RANGE", "MASTER_CARTOGRAPHER", "CONTRACT_KEEPER", "ATLAS_PATHFINDER", "EXPEDITION_ARCHIVIST"]),
      unlockedAt: finiteNumber.nonnegative(),
    })).max(50).optional(),
  }).optional(),
  tiles: z.record(z.string(), tileSchema).optional(),
  workouts: z.array(workoutSchema).max(200).optional(),
  settings: z.object({
    trackingMode: z.enum(["balanced", "precision", "battery-saver"]).optional(),
    hapticsEnabled: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
    mapProvider: z.enum(["OpenFreeMap", "OpenStreetMap"]).optional(),
    mapStyleUrl: z.string().url().max(512).refine((value) => value.startsWith("https://")).optional(),
    terrainOverlayEnabled: z.boolean().optional(),
  }).optional(),
  offlineRegions: z.array(z.object({
    id: z.string().regex(/^atlas-\d+-\d+-\d+$/),
    latitude: finiteNumber.min(-85.05112878).max(85.05112878),
    longitude: finiteNumber.min(-180).max(180),
    zoom: z.number().int().min(10).max(17),
    tileCount: z.number().int().min(1).max(25),
    downloadedAt: finiteNumber.nonnegative(),
    provider: z.enum(["OpenStreetMap", "OpenFreeMap"]),
  })).max(4).optional(),
  activeOfflineRegionId: z.string().regex(/^atlas-\d+-\d+-\d+$/).nullable().optional(),
  offlineArchives: z.array(z.object({
    id: z.string().regex(/^archive-[a-z0-9]+$/),
    name: z.string().min(1).max(128),
    format: z.enum(["PMTiles", "MBTiles"]),
    uri: z.string().max(2048),
    sizeBytes: finiteNumber.int().positive().max(1024 * 1024 * 1024),
    importedAt: finiteNumber.nonnegative(),
    source: z.string().min(1).max(64),
  })).max(8).optional(),
  momentum: z.object({
    lastExpeditionDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    currentStreak: z.number().int().nonnegative().max(10_000).optional(),
    longestStreak: z.number().int().nonnegative().max(10_000).optional(),
    totalFieldDays: z.number().int().nonnegative().max(100_000).optional(),
  }).optional(),
  personalRecords: z.array(z.object({
    kind: z.enum(["LONGEST_DISTANCE", "MOST_NEW_CELLS", "BEST_PACE"]),
    value: finiteNumber.nonnegative().max(10_000_000),
    achievedAt: finiteNumber.nonnegative(),
    workoutId: z.string().min(1).max(160),
  })).max(3).optional(),
}).passthrough();

export function migrateRunQuestState(value: unknown): RunQuestState {
  const parsed = persistedStateSchema.safeParse(value);
  const candidate = parsed.success ? parsed.data : {};
  return {
    ...DEFAULT_RUNQUEST_STATE,
    ...candidate,
    version: RUNQUEST_STATE_VERSION,
    profile: { ...DEFAULT_RUNQUEST_STATE.profile, ...candidate.profile },
    tiles: candidate.tiles ?? {},
    workouts: Array.isArray(candidate.workouts) ? candidate.workouts.slice(0, 200).map((workout) => ({ ...workout, contractRewardXp: workout.contractRewardXp ?? 0 })) : [],
    settings: { ...DEFAULT_RUNQUEST_STATE.settings, ...candidate.settings },
    offlineRegions: candidate.offlineRegions ?? [],
    activeOfflineRegionId: candidate.activeOfflineRegionId ?? null,
    offlineArchives: candidate.offlineArchives ?? [],
    momentum: { ...DEFAULT_RUNQUEST_STATE.momentum, ...candidate.momentum },
    personalRecords: candidate.personalRecords ?? [],
  };
}
