import { describe, expect, it } from "vitest";

import { getDailyContract } from "@/lib/runquest/contracts";
import { evaluateNewAchievements } from "@/lib/runquest/achievements";
import { createOfflineRegion, offlineTileCoordinates } from "@/lib/runquest/offline-regions";
import { calculateLevel, calculateXp, encodeHexGridV1, processLocationSample } from "@/lib/runquest/engine";
import { migrateRunQuestState } from "@/lib/runquest/migration";
import { normalizeMapStyleUrl, OPENFREEMAP_STYLE_URL } from "@/lib/runquest/map-providers";
import { canFollowCamera, createAccuracyFeature, getMarkerAccuracyBand, getAccuracyRadiusMeters, shouldInterruptFollow } from "@/lib/runquest/map-marker";
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

  it("defaults legacy settings to the OpenFreeMap style without changing saved game data", () => {
    const migrated = migrateRunQuestState({ profile: { totalXp: 25 } });
    expect(migrated.settings.mapProvider).toBe("OpenFreeMap");
    expect(migrated.settings.mapStyleUrl).toBe(OPENFREEMAP_STYLE_URL);
  });

  it("classifies marker accuracy and creates a bounded geodesic confidence ring", () => {
    expect(getMarkerAccuracyBand(8)).toBe("excellent");
    expect(getMarkerAccuracyBand(32)).toBe("good");
    expect(getMarkerAccuracyBand(75)).toBe("fair");
    expect(getMarkerAccuracyBand(180)).toBe("poor");
    expect(getMarkerAccuracyBand(null)).toBe("unknown");
    expect(getAccuracyRadiusMeters(2)).toBe(6);
    expect(getAccuracyRadiusMeters(250)).toBe(150);
    const feature = createAccuracyFeature(firstPoint);
    expect(feature?.geometry.type).toBe("Polygon");
    expect(feature?.geometry.coordinates[0]).toHaveLength(33);
  });

  it("interrupts camera follow only for user interaction and preserves recenter eligibility", () => {
    expect(canFollowCamera("following", true)).toBe(true);
    expect(canFollowCamera("free", true)).toBe(false);
    expect(shouldInterruptFollow(true, "following")).toBe(true);
    expect(shouldInterruptFollow(false, "following")).toBe(false);
    expect(shouldInterruptFollow(true, "free")).toBe(false);
  });

  it("accepts only bounded HTTPS map style URLs", () => {
    expect(normalizeMapStyleUrl(OPENFREEMAP_STYLE_URL)).toBe(OPENFREEMAP_STYLE_URL);
    expect(normalizeMapStyleUrl("http://example.com/style.json")).toBeNull();
    expect(normalizeMapStyleUrl("not a url")).toBeNull();
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

  it("creates a deterministic, bounded offline Atlas pack around a coordinate", () => {
    const region = createOfflineRegion(37.7749, -122.4194, 1_000);
    expect(region.id).toMatch(/^atlas-14-\d+-\d+$/);
    expect(region.tileCount).toBe(9);
    expect(offlineTileCoordinates(region)).toHaveLength(9);
  });

  it("migrates legacy state with no offline packs and rejects oversized pack lists", () => {
    expect(migrateRunQuestState({}).offlineRegions).toEqual([]);
    const oversized = Array.from({ length: 5 }, (_, index) => ({ id: `atlas-14-${index}-${index}`, latitude: 1, longitude: 1, zoom: 14, tileCount: 9, downloadedAt: 1, provider: "OpenStreetMap" }));
    expect(migrateRunQuestState({ offlineRegions: oversized }).offlineRegions).toEqual([]);
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
