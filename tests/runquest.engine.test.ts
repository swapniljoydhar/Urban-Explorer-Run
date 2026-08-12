import { describe, expect, it } from "vitest";

import { getDailyContract } from "@/lib/runquest/contracts";
import { evaluateNewAchievements } from "@/lib/runquest/achievements";
import { calculateLevel, calculateXp, encodeHexGridV1, processLocationSample } from "@/lib/runquest/engine";
import { migrateRunQuestState } from "@/lib/runquest/migration";
import { safelyRemoveSubscription } from "@/lib/runquest/subscriptions";
import type { ActiveExpedition, RoutePoint } from "@/lib/runquest/types";

const firstPoint: RoutePoint = { latitude: 37.7749, longitude: -122.4194, timestamp: 1_000, accuracy: 8 };

function expedition(): ActiveExpedition {
  return {
    id: "test-session",
    startedAt: 500,
    mode: "demo",
    status: "active",
    distanceMeters: 0,
    steps: 0,
    xpEarned: 0,
    newTileIds: [],
    visitedTileIds: [],
    route: [],
    lastPoint: null,
    demoSequence: 0,
    notice: "test",
  };
}

describe("RunQuest compatibility-safe engine", () => {
  it("keeps core XP and level rules deterministic", () => {
    expect(calculateXp(1_000, 0)).toBe(120);
    expect(calculateXp(0, 1)).toBe(50);
    expect(calculateXp(-1, -1)).toBe(0);
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(200)).toBe(2);
    expect(calculateLevel(800)).toBe(3);
  });

  it("produces a stable versioned tile identity for the same coordinate", () => {
    expect(encodeHexGridV1(37.7749, -122.4194)).toBe(encodeHexGridV1(37.7749, -122.4194));
    expect(encodeHexGridV1(37.7749, -122.4194)).toContain("rq:hex-grid-v1:");
  });

  it("does not award duplicate discovery XP when an old event is replayed", () => {
    const first = processLocationSample(expedition(), {}, firstPoint);
    const replay = processLocationSample(first.nextExpedition, first.nextTiles, { ...firstPoint, timestamp: 1_100 });
    expect(first.discoveredTileId).not.toBeNull();
    expect(first.xpGained).toBe(50);
    expect(replay.discoveredTileId).toBeNull();
    expect(replay.xpGained).toBe(0);
  });

  it("does not turn weak GPS into false territory rewards", () => {
    const weakSample = { ...firstPoint, accuracy: 100 };
    const result = processLocationSample(expedition(), {}, weakSample);
    expect(result.discoveredTileId).toBeNull();
    expect(result.xpGained).toBe(0);
    expect(Object.keys(result.nextTiles)).toHaveLength(0);
  });

  it("rejects invalid, out-of-order, and implausibly fast movement samples", () => {
    const first = processLocationSample(expedition(), {}, firstPoint);
    const invalid = processLocationSample(first.nextExpedition, first.nextTiles, { ...firstPoint, latitude: 100, timestamp: 2_000 });
    const outOfOrder = processLocationSample(first.nextExpedition, first.nextTiles, { ...firstPoint, timestamp: 999 });
    const tooFast = processLocationSample(first.nextExpedition, first.nextTiles, { latitude: 37.7849, longitude: -122.4194, timestamp: 2_000, accuracy: 8 });
    expect(invalid.xpGained).toBe(0);
    expect(outOfOrder.xpGained).toBe(0);
    expect(tooFast.xpGained).toBe(0);
    expect(tooFast.nextExpedition.route).toHaveLength(first.nextExpedition.route.length);
  });

  it("counts a revisited tile once per expedition while preserving cross-expedition mastery", () => {
    const discovered = processLocationSample(expedition(), {}, firstPoint);
    const returnVisit = processLocationSample(expedition(), discovered.nextTiles, { ...firstPoint, timestamp: 5_000 });
    const duplicateVisit = processLocationSample(returnVisit.nextExpedition, returnVisit.nextTiles, { ...firstPoint, timestamp: 10_000 });
    const tileId = discovered.discoveredTileId as string;
    expect(returnVisit.nextTiles[tileId].visitCount).toBe(2);
    expect(duplicateVisit.nextTiles[tileId].visitCount).toBe(2);
    expect(duplicateVisit.nextTiles[tileId].mastery).toBe("MAPPED");
  });

  it("keeps the in-memory route window bounded during long expeditions", () => {
    const active = expedition();
    active.route = Array.from({ length: 250 }, (_, index) => ({ latitude: 37.7749 + index * 0.000001, longitude: -122.4194, timestamp: 1_000 + index, accuracy: 6 }));
    active.lastPoint = active.route.at(-1) ?? null;
    const result = processLocationSample(active, {}, { latitude: 37.7752, longitude: -122.4194, timestamp: 2_000, accuracy: 6 });
    expect(result.nextExpedition.route).toHaveLength(250);
  });

  it("reads a minimal legacy state without losing safe defaults", () => {
    const migrated = migrateRunQuestState({ profile: { totalXp: 800 }, settings: { hapticsEnabled: false } });
    expect(migrated.version).toBe(1);
    expect(migrated.profile.totalXp).toBe(800);
    expect(migrated.profile.title).toBe("Neighborhood Scout");
    expect(migrated.profile.completedContractClaims).toEqual([]);
    expect(migrated.profile.achievements).toEqual([]);
    expect(migrated.settings.hapticsEnabled).toBe(false);
    expect(migrated.settings.trackingMode).toBe("balanced");
    expect(migrated.workouts).toEqual([]);
  });

  it("rejects malformed persisted values instead of accepting unsafe numeric data", () => {
    const migrated = migrateRunQuestState({ profile: { totalXp: -50 }, settings: { trackingMode: "not-a-mode" } });
    expect(migrated.profile.totalXp).toBe(0);
    expect(migrated.settings.trackingMode).toBe("balanced");
  });

  it("keeps the daily field contract deterministic for a local calendar day", () => {
    const timestamp = new Date(2026, 7, 12, 9, 0, 0).getTime();
    const first = getDailyContract(timestamp);
    const second = getDailyContract(timestamp);
    expect(first).toEqual(second);
    expect(first.claimKey).toContain("2026-08-12");
  });

  it("unlocks permanent achievements once without duplicating daily contracts", () => {
    const baseline = migrateRunQuestState({});
    const active = expedition();
    active.newTileIds = ["one", "two", "three"];
    active.distanceMeters = 2_500;
    const firstUnlocks = evaluateNewAchievements(baseline, active, 100, false);
    expect(firstUnlocks).toContain("FIRST_MARK");
    expect(firstUnlocks).toContain("FRONTIER_FINDER");
    expect(firstUnlocks).toContain("LONG_RANGE");
    expect(firstUnlocks).not.toContain("CONTRACT_KEEPER");
    const withFirstMark = {
      ...baseline,
      profile: { ...baseline.profile, achievements: [{ id: "FIRST_MARK" as const, unlockedAt: 1 }] },
    };
    expect(evaluateNewAchievements(withFirstMark, active, 100, false)).not.toContain("FIRST_MARK");
  });

  it("never calls a browser location subscription removal path during cleanup", () => {
    let removeCalls = 0;
    safelyRemoveSubscription({ remove: () => { removeCalls += 1; } }, "web");
    expect(removeCalls).toBe(0);
  });

  it("releases native subscriptions once and absorbs an already-disposed emitter", () => {
    let removeCalls = 0;
    safelyRemoveSubscription({ remove: () => { removeCalls += 1; } }, "android");
    safelyRemoveSubscription({ remove: () => { throw new Error("already disposed"); } }, "android");
    expect(removeCalls).toBe(1);
  });
});
