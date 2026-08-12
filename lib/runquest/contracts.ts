import type { ActiveExpedition, FieldContract, RunQuestState } from "@/lib/runquest/types";

const contracts: Omit<FieldContract, "claimKey">[] = [
  { kind: "FRONTIER", title: "Frontier Scan", instruction: "Reveal 2 new atlas cells today.", target: 2, rewardXp: 150, unit: "cells" },
  { kind: "ENDURANCE", title: "Long Line", instruction: "Record 1.2 km of expedition distance today.", target: 1_200, rewardXp: 140, unit: "meters" },
  { kind: "EXPEDITION", title: "Field Check", instruction: "Complete 1 expedition today.", target: 1, rewardXp: 100, unit: "expedition" },
];

export function localDayKey(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayStart(timestamp = Date.now()): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getDailyContract(timestamp = Date.now()): FieldContract {
  const key = localDayKey(timestamp);
  const index = [...key].reduce((total, character) => total + character.charCodeAt(0), 0) % contracts.length;
  return { ...contracts[index], claimKey: `${key}:${contracts[index].kind}` };
}

export function getContractProgress(state: RunQuestState, contract: FieldContract, active?: ActiveExpedition | null, timestamp = Date.now()): number {
  const start = dayStart(timestamp);
  if (contract.kind === "FRONTIER") {
    return Object.values(state.tiles).filter((tile) => tile.firstVisitedAt >= start).length;
  }
  if (contract.kind === "ENDURANCE") {
    const persisted = state.workouts.filter((workout) => workout.endedAt >= start).reduce((total, workout) => total + workout.distanceMeters, 0);
    return persisted + (active?.distanceMeters ?? 0);
  }
  return state.workouts.filter((workout) => workout.endedAt >= start).length + (active ? 1 : 0);
}

export function isContractClaimed(state: RunQuestState, contract: FieldContract): boolean {
  return state.profile.completedContractClaims.includes(contract.claimKey);
}

export function formatContractProgress(contract: FieldContract, progress: number): string {
  if (contract.unit === "meters") return `${Math.min(contract.target, Math.round(progress))} / ${contract.target} m`;
  return `${Math.min(contract.target, Math.floor(progress))} / ${contract.target}`;
}
