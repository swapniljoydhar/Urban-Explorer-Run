export const RUNQUEST_STATE_VERSION = 1;
export const TILE_ENCODER_VERSION = "hex-grid-v1" as const;
export const PROGRESSION_RULESET_VERSION = "rq-progression-v1" as const;

export type CapabilityState = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "BLOCKED_BY_USER";
export type TrackingMode = "balanced" | "precision" | "battery-saver";
export type ExpeditionMode = "live" | "demo";
export type ExpeditionStatus = "active" | "paused";
export type PaceZone = "SETTLING" | "EASY" | "STEADY" | "BRISK" | "SWIFT";

export type RunQuestCapability = {
  state: CapabilityState;
  label: string;
  detail: string;
};

export type CapabilitySnapshot = {
  location: RunQuestCapability;
  steps: RunQuestCapability;
  background: RunQuestCapability;
  haptics: RunQuestCapability;
  offline: RunQuestCapability;
};

export type TileRecord = {
  id: string;
  encoderVersion: typeof TILE_ENCODER_VERSION;
  /** Optional for legacy v1 records; new discoveries retain geographic centers for map rendering. */
  latitude?: number;
  longitude?: number;
  firstVisitedAt: number;
  lastVisitedAt: number;
  visitCount: number;
  mastery: "SEEN" | "MAPPED" | "MASTERED";
};

export type RoutePoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number | null;
};

export type WorkoutRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  mode: ExpeditionMode;
  distanceMeters: number;
  steps: number;
  xpEarned: number;
  newTileCount: number;
  contractRewardXp: number;
  route: RoutePoint[];
  rulesetVersion: typeof PROGRESSION_RULESET_VERSION;
  /** Optional for pre-summary history; calculated locally at expedition completion. */
  paceZoneSummary?: PaceZoneSummary;
};

export type ExplorerMomentum = {
  /** Local calendar day of the most recent completed expedition, never uploaded. */
  lastExpeditionDay: string | null;
  currentStreak: number;
  longestStreak: number;
  totalFieldDays: number;
};

export type PersonalRecordKind = "LONGEST_DISTANCE" | "MOST_NEW_CELLS" | "BEST_PACE";

export type PersonalRecord = {
  kind: PersonalRecordKind;
  value: number;
  achievedAt: number;
  workoutId: string;
};

export type FieldBrief = {
  title: string;
  objective: string;
  cue: string;
};

export type PaceCoachState = {
  zone: PaceZone;
  paceSecondsPerKm: number | null;
  message: string;
  lastCueAt: number | null;
  lastCuedZone: PaceZone | null;
};

export type PaceZoneSummary = {
  easySeconds: number;
  steadySeconds: number;
  briskSeconds: number;
  swiftSeconds: number;
  analyzedSeconds: number;
  excludedSeconds: number;
};

export type PlayerProfile = {
  totalXp: number;
  title: string;
  badges: string[];
  completedContractClaims: string[];
  achievements: AchievementRecord[];
};

export type AchievementId = "FIRST_MARK" | "FRONTIER_FINDER" | "LONG_RANGE" | "MASTER_CARTOGRAPHER" | "CONTRACT_KEEPER" | "ATLAS_PATHFINDER" | "EXPEDITION_ARCHIVIST";

export type AchievementRecord = {
  id: AchievementId;
  unlockedAt: number;
};

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  icon: "explore" | "public" | "directions-run" | "auto-awesome" | "verified" | "map" | "history";
};

export type RunQuestSettings = {
  trackingMode: TrackingMode;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  /** Added as optional-compatible settings; legacy v1 data defaults to OpenFreeMap. */
  mapProvider: "OpenFreeMap" | "OpenStreetMap";
  mapStyleUrl: string;
  /** A visual-only online hillshade; never downloaded into Atlas packs. */
  terrainOverlayEnabled: boolean;
  /** Private, foreground-only pace guidance derived from accepted route samples. */
  paceCoachingEnabled: boolean;
  /** Requires both pace coaching and the existing global haptics preference. */
  paceCoachingHapticsEnabled: boolean;
};

export type OfflineMapRegion = {
  id: string;
  latitude: number;
  longitude: number;
  zoom: number;
  tileCount: number;
  downloadedAt: number;
  provider: "OpenStreetMap" | "OpenFreeMap";
};

export type OfflineArchiveRecord = {
  id: string;
  name: string;
  format: "PMTiles" | "MBTiles";
  uri: string;
  sizeBytes: number;
  importedAt: number;
  source: string;
};

export type RunQuestState = {
  version: typeof RUNQUEST_STATE_VERSION;
  profile: PlayerProfile;
  tiles: Record<string, TileRecord>;
  workouts: WorkoutRecord[];
  settings: RunQuestSettings;
  offlineRegions: OfflineMapRegion[];
  activeOfflineRegionId: string | null;
  offlineArchives: OfflineArchiveRecord[];
  momentum: ExplorerMomentum;
  personalRecords: PersonalRecord[];
};

export type ActiveExpedition = {
  id: string;
  startedAt: number;
  mode: ExpeditionMode;
  status: ExpeditionStatus;
  distanceMeters: number;
  steps: number;
  xpEarned: number;
  newTileIds: string[];
  visitedTileIds: string[];
  route: RoutePoint[];
  lastPoint: RoutePoint | null;
  demoSequence: number;
  notice: string;
  fieldBrief: FieldBrief;
  paceCoach: PaceCoachState;
};

export type FieldContractKind = "FRONTIER" | "ENDURANCE" | "EXPEDITION";

export type FieldContract = {
  claimKey: string;
  kind: FieldContractKind;
  title: string;
  instruction: string;
  target: number;
  rewardXp: number;
  unit: "cells" | "meters" | "expedition";
};

export type ExpeditionReport = {
  workout: WorkoutRecord;
  contract: FieldContract;
  contractProgress: number;
  contractCompleted: boolean;
  totalXpBefore: number;
  totalXpAfter: number;
  unlockedAchievementIds: AchievementId[];
  momentum: ExplorerMomentum;
  newPersonalRecordKinds: PersonalRecordKind[];
  fieldBrief: FieldBrief;
};

export type DiscoveryOutcome = {
  nextExpedition: ActiveExpedition;
  nextTiles: Record<string, TileRecord>;
  xpGained: number;
  discoveredTileId: string | null;
};
