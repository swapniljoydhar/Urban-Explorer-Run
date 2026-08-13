import { migrateRunQuestState } from "@/lib/runquest/migration";
import type { RunQuestState } from "@/lib/runquest/types";

export function decodeRunQuestState(raw: string | null): RunQuestState | null {
  if (!raw) return null;
  try {
    return migrateRunQuestState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}
