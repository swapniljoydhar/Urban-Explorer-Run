import { RUNQUEST_STATE_VERSION, type RunQuestState } from "@/lib/runquest/types";

export const DEFAULT_RUNQUEST_STATE: RunQuestState = {
  version: RUNQUEST_STATE_VERSION,
  profile: { totalXp: 0, title: "Neighborhood Scout", badges: [], completedContractClaims: [], achievements: [] },
  tiles: {},
  workouts: [],
  settings: { trackingMode: "balanced", hapticsEnabled: true, reduceMotion: false },
  offlineRegions: [],
};
