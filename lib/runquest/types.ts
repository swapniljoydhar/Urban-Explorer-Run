export const RUNQUEST_STATE_VERSION = 1;
export const TILE_ENCODER_VERSION = "hex-grid-v1" as const;
export const PROGRESSION_RULESET_VERSION = "rq-progression-v1" as const;

export type CapabilityState = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "BLOCKED_BY_USER";
export type TrackingMode = "balanced" | "precision" | "battery-saver";
export type ExpeditionMode = "live" | "demo";
export type ExpeditionStatus = "active" | "paused";

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
};

export type RunQuestState = {
  version: typeof RUNQUEST_STATE_VERSION;
  profile: PlayerProfile;
  tiles: Record<string, TileRecord>;
  workouts: WorkoutRecord[];
  settings: RunQuestSettings;
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
};

export type DiscoveryOutcome = {
  nextExpedition: ActiveExpedition;
  nextTiles: Record<string, TileRecord>;
  xpGained: number;
  discoveredTileId: string | null;
};
