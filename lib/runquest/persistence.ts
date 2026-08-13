import AsyncStorage from "@react-native-async-storage/async-storage";

import { RUNQUEST_STATE_VERSION, type RunQuestState } from "@/lib/runquest/types";
import { DEFAULT_RUNQUEST_STATE } from "@/lib/runquest/persistence-defaults";
import { decodeRunQuestState } from "@/lib/runquest/persistence-codec";

const STORAGE_KEY = "runquest:state";
const BACKUP_STORAGE_KEY = "runquest:state:backup";

export { DEFAULT_RUNQUEST_STATE } from "@/lib/runquest/persistence-defaults";

export async function loadRunQuestState(): Promise<RunQuestState> {
  try {
    const entries = await AsyncStorage.multiGet([STORAGE_KEY, BACKUP_STORAGE_KEY]);
    const values = new Map(entries);
    return decodeRunQuestState(values.get(STORAGE_KEY) ?? null)
      ?? decodeRunQuestState(values.get(BACKUP_STORAGE_KEY) ?? null)
      ?? DEFAULT_RUNQUEST_STATE;
  } catch {
    return DEFAULT_RUNQUEST_STATE;
  }
}

export async function saveRunQuestState(state: RunQuestState): Promise<boolean> {
  try {
    const serialized = JSON.stringify({ ...state, version: RUNQUEST_STATE_VERSION });
    // Write the recovery copy first: if a later primary write is interrupted, the newest fully written snapshot remains recoverable.
    await AsyncStorage.setItem(BACKUP_STORAGE_KEY, serialized);
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}
