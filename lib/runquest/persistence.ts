import AsyncStorage from "@react-native-async-storage/async-storage";

import { RUNQUEST_STATE_VERSION, type RunQuestState } from "@/lib/runquest/types";
import { migrateRunQuestState } from "@/lib/runquest/migration";
import { DEFAULT_RUNQUEST_STATE } from "@/lib/runquest/persistence-defaults";

const STORAGE_KEY = "runquest:state";

export { DEFAULT_RUNQUEST_STATE } from "@/lib/runquest/persistence-defaults";

export async function loadRunQuestState(): Promise<RunQuestState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RUNQUEST_STATE;
    const parsed: unknown = JSON.parse(raw);
    return migrateRunQuestState(parsed);
  } catch {
    return DEFAULT_RUNQUEST_STATE;
  }
}

export async function saveRunQuestState(state: RunQuestState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: RUNQUEST_STATE_VERSION }));
}
