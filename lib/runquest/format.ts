import type { PersonalRecord } from "@/lib/runquest/types";

export function formatDistance(meters: number): string {
  if (meters < 1_000) return `${Math.round(meters)} m`;
  return `${(meters / 1_000).toFixed(meters >= 10_000 ? 0 : 2)} km`;
}

export function formatDuration(startedAt: number, endedAt = Date.now()): string {
  const seconds = Math.max(0, Math.floor((endedAt - startedAt) / 1_000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(timestamp);
}

export function formatPace(secondsPerKilometer: number): string {
  if (!Number.isFinite(secondsPerKilometer) || secondsPerKilometer <= 0) return "—";
  const minutes = Math.floor(secondsPerKilometer / 60);
  const seconds = Math.round(secondsPerKilometer % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

export function formatPersonalRecord(record: PersonalRecord | undefined): string {
  if (!record) return "—";
  if (record.kind === "LONGEST_DISTANCE") return formatDistance(record.value);
  if (record.kind === "MOST_NEW_CELLS") return `${record.value}`;
  return formatPace(record.value);
}
