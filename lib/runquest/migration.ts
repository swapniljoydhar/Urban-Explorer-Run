import { RUNQUEST_STATE_VERSION, type RunQuestState } from "@/lib/runquest/types";
import { DEFAULT_RUNQUEST_STATE } from "@/lib/runquest/persistence-defaults";

export function migrateRunQuestState(value: unknown): RunQuestState {
  const candidate = value && typeof value === "object" ? value as Partial<RunQuestState> : {};
  return {
    ...DEFAULT_RUNQUEST_STATE,
    ...candidate,
    version: RUNQUEST_STATE_VERSION,
    profile: { ...DEFAULT_RUNQUEST_STATE.profile, ...candidate.profile },
    tiles: candidate.tiles ?? {},
    workouts: Array.isArray(candidate.workouts) ? candidate.workouts.slice(0, 200) : [],
    settings: { ...DEFAULT_RUNQUEST_STATE.settings, ...candidate.settings },
  };
}
