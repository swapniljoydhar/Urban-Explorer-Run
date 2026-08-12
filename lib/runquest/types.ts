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
  route: RoutePoint[];
  rulesetVersion: typeof PROGRESSION_RULESET_VERSION;
};

export type PlayerProfile = {
  totalXp: number;
  title: string;
  badges: string[];
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
  route: RoutePoint[];
  lastPoint: RoutePoint | null;
  demoSequence: number;
  notice: string;
};

export type DiscoveryOutcome = {
  nextExpedition: ActiveExpedition;
  nextTiles: Record<string, TileRecord>;
  xpGained: number;
  discoveredTileId: string | null;
};
