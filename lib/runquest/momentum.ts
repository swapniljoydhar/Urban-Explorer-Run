import type { ExplorerMomentum, PersonalRecord, PersonalRecordKind, WorkoutRecord } from "@/lib/runquest/types";

const PERSONAL_RECORD_ORDER: PersonalRecordKind[] = ["LONGEST_DISTANCE", "MOST_NEW_CELLS", "BEST_PACE"];

export function getLocalDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayStamp(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function advanceExplorerMomentum(previous: ExplorerMomentum, completedAt: number): ExplorerMomentum {
  const nextDay = getLocalDayKey(completedAt);
  if (previous.lastExpeditionDay === nextDay) return previous;

  const consecutive = previous.lastExpeditionDay !== null && dayStamp(nextDay) - dayStamp(previous.lastExpeditionDay) === 1;
  const currentStreak = consecutive ? previous.currentStreak + 1 : 1;
  return {
    lastExpeditionDay: nextDay,
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    totalFieldDays: previous.totalFieldDays + 1,
  };
}

export function getWorkoutDurationSeconds(workout: WorkoutRecord): number {
  return Math.max(0, Math.round((workout.endedAt - workout.startedAt) / 1_000));
}

export function getPaceSecondsPerKilometer(workout: WorkoutRecord): number | null {
  if (workout.distanceMeters < 1_000) return null;
  const durationSeconds = getWorkoutDurationSeconds(workout);
  if (durationSeconds <= 0) return null;
  return Math.round(durationSeconds / (workout.distanceMeters / 1_000));
}

type RecordCandidate = { kind: PersonalRecordKind; value: number };

function getRecordCandidates(workout: WorkoutRecord): RecordCandidate[] {
  const candidates: RecordCandidate[] = [];
  if (workout.distanceMeters > 0) candidates.push({ kind: "LONGEST_DISTANCE", value: Math.round(workout.distanceMeters) });
  if (workout.newTileCount > 0) candidates.push({ kind: "MOST_NEW_CELLS", value: workout.newTileCount });
  const pace = getPaceSecondsPerKilometer(workout);
  if (pace !== null) candidates.push({ kind: "BEST_PACE", value: pace });
  return candidates;
}

function isBetter(kind: PersonalRecordKind, nextValue: number, currentValue: number): boolean {
  return kind === "BEST_PACE" ? nextValue < currentValue : nextValue > currentValue;
}

export function updatePersonalRecords(
  existingRecords: PersonalRecord[],
  workout: WorkoutRecord,
): { records: PersonalRecord[]; newRecordKinds: PersonalRecordKind[] } {
  const recordByKind = new Map(existingRecords.map((record) => [record.kind, record]));
  const newRecordKinds: PersonalRecordKind[] = [];

  for (const candidate of getRecordCandidates(workout)) {
    const current = recordByKind.get(candidate.kind);
    if (current && !isBetter(candidate.kind, candidate.value, current.value)) continue;
    recordByKind.set(candidate.kind, {
      kind: candidate.kind,
      value: candidate.value,
      achievedAt: workout.endedAt,
      workoutId: workout.id,
    });
    newRecordKinds.push(candidate.kind);
  }

  return {
    records: PERSONAL_RECORD_ORDER.flatMap((kind) => {
      const record = recordByKind.get(kind);
      return record ? [record] : [];
    }),
    newRecordKinds,
  };
}
