import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Pedometer } from "expo-sensors";

import { inspectCapabilities } from "@/lib/runquest/capabilities";
import { evaluateNewAchievements } from "@/lib/runquest/achievements";
import { getContractProgress, getDailyContract, isContractClaimed } from "@/lib/runquest/contracts";
import { createDemoPoint, createWorkoutId, currentRuleset, processLocationSample, resolveTitle } from "@/lib/runquest/engine";
import { advanceExplorerMomentum, updatePersonalRecords } from "@/lib/runquest/momentum";
import { getFieldBrief } from "@/lib/runquest/nature";
import { DEFAULT_RUNQUEST_STATE, loadRunQuestState, saveRunQuestState } from "@/lib/runquest/persistence";
import { safelyRemoveSubscription } from "@/lib/runquest/subscriptions";
import { openLocation, type OpenLocationListener } from "@/lib/runquest/open-location";
import { importOfflineArchiveAsset, inspectOfflineRegion, inspectOfflineTerrainArchive, offlineRegionStorageExists, removeOfflineArchive, removeOfflineRegion, shareOfflineArchive, type OfflineRegionInspection, type OfflineTerrainArchiveInspection } from "@/lib/runquest/offline-packages";
import {
  type ActiveExpedition,
  type CapabilitySnapshot,
  type ExpeditionReport,
  type ExpeditionMode,
  type RoutePoint,
  type RunQuestState,
  type OfflineMapRegion,
  type TrackingMode,
} from "@/lib/runquest/types";

type RunQuestContextValue = {
  hydrated: boolean;
  state: RunQuestState;
  activeExpedition: ActiveExpedition | null;
  latestReport: ExpeditionReport | null;
  persistenceState: "SAVED" | "SAVING" | "PENDING";
  capabilities: CapabilitySnapshot | null;
  refreshCapabilities: () => Promise<void>;
  startExpedition: () => Promise<ExpeditionMode>;
  pauseExpedition: () => void;
  resumeExpedition: () => void;
  endExpedition: () => Promise<void>;
  recordDemoDiscovery: () => void;
  dismissReport: () => void;
  setTrackingMode: (mode: TrackingMode) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setMapStyleUrl: (url: string) => void;
  setTerrainOverlayEnabled: (enabled: boolean) => void;
  offlineAction: { state: "IDLE" | "DOWNLOADING" | "ERROR"; completed: number; total: number; message: string | null };
  downloadCurrentOfflineRegion: () => Promise<void>;
  removeOfflineRegion: (id: string) => Promise<void>;
  setActiveOfflineRegion: (id: string | null) => void;
  inspectOfflineRegion: (id: string) => Promise<OfflineRegionInspection | null>;
  repairOfflineRegion: (id: string) => Promise<void>;
  importOfflineArchive: () => Promise<void>;
  exportOfflineArchive: (id: string) => Promise<void>;
  removeOfflineArchive: (id: string) => Promise<void>;
  inspectOfflineTerrainArchive: (id: string) => Promise<OfflineTerrainArchiveInspection | null>;
};

const RunQuestContext = createContext<RunQuestContextValue | null>(null);

function createExpedition(mode: ExpeditionMode, currentStreak: number): ActiveExpedition {
  const startedAt = Date.now();
  return {
    id: createWorkoutId(startedAt),
    startedAt,
    mode,
    status: "active",
    distanceMeters: 0,
    steps: 0,
    xpEarned: 0,
    newTileIds: [],
    visitedTileIds: [],
    route: [],
    lastPoint: null,
    demoSequence: 0,
    notice: mode === "live" ? "Live foreground tracking started." : "Demo expedition started — your progress is stored locally.",
    fieldBrief: getFieldBrief(startedAt, currentStreak),
  };
}

export function RunQuestProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<RunQuestState>(DEFAULT_RUNQUEST_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [activeExpedition, setActiveExpedition] = useState<ActiveExpedition | null>(null);
  const [latestReport, setLatestReport] = useState<ExpeditionReport | null>(null);
  const [persistenceState, setPersistenceState] = useState<"SAVED" | "SAVING" | "PENDING">("SAVED");
  const [capabilities, setCapabilities] = useState<CapabilitySnapshot | null>(null);
  const [offlineAction, setOfflineAction] = useState<{ state: "IDLE" | "DOWNLOADING" | "ERROR"; completed: number; total: number; message: string | null }>({ state: "IDLE", completed: 0, total: 0, message: null });
  const stateRef = useRef(state);
  const activeRef = useRef<ActiveExpedition | null>(null);
  const locationListener = useRef<OpenLocationListener | null>(null);
  const pedometerSubscription = useRef<{ remove: () => void } | null>(null);
  const pendingPersist = useRef<RunQuestState | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistenceInFlight = useRef(false);

  useEffect(() => {
    void Promise.all([loadRunQuestState(), inspectCapabilities()]).then(async ([persistedState, nextCapabilities]) => {
      const confirmedRegions = (await Promise.all(persistedState.offlineRegions.map(async (region) => (await offlineRegionStorageExists(region)) ? region : null))).filter((region): region is OfflineMapRegion => region !== null);
      const hydratedState = confirmedRegions.length === persistedState.offlineRegions.length ? persistedState : { ...persistedState, offlineRegions: confirmedRegions };
      stateRef.current = hydratedState;
      setState(hydratedState);
      if (hydratedState !== persistedState) void saveRunQuestState(hydratedState);
      setCapabilities(nextCapabilities);
      setHydrated(true);
    });
  }, []);

  const flushPersistence = useCallback(async () => {
    if (persistenceInFlight.current) return;
    const snapshot = pendingPersist.current;
    if (!snapshot) return;
    pendingPersist.current = null;
    persistenceInFlight.current = true;
    const saved = await saveRunQuestState(snapshot);
    persistenceInFlight.current = false;
    if (pendingPersist.current) {
      setPersistenceState("SAVING");
      void flushPersistence();
      return;
    }
    if (saved) {
      setPersistenceState("SAVED");
      return;
    }
    pendingPersist.current = snapshot;
    setPersistenceState("PENDING");
    if (!persistTimer.current) {
      persistTimer.current = setTimeout(() => {
        persistTimer.current = null;
        void flushPersistence();
      }, 5_000);
    }
  }, []);

  const commitState = useCallback((nextState: RunQuestState, immediately = false) => {
    stateRef.current = nextState;
    setState(nextState);
    pendingPersist.current = nextState;
    setPersistenceState("SAVING");
    if (immediately) {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = null;
      void flushPersistence();
      return;
    }
    if (!persistTimer.current) {
      persistTimer.current = setTimeout(() => {
        persistTimer.current = null;
        void flushPersistence();
      }, 700);
    }
  }, [flushPersistence]);

  const refreshCapabilities = useCallback(async () => {
    setCapabilities(await inspectCapabilities());
  }, []);

  const clearSubscriptions = useCallback(() => {
    if (locationListener.current) openLocation.removeListener(locationListener.current);
    locationListener.current = null;
    safelyRemoveSubscription(pedometerSubscription.current, Platform.OS);
    pedometerSubscription.current = null;
  }, []);

  const applyPoint = useCallback((point: RoutePoint) => {
    const expedition = activeRef.current;
    if (!expedition || expedition.status !== "active") return;
    const outcome = processLocationSample(expedition, stateRef.current.tiles, point);
    activeRef.current = outcome.nextExpedition;
    setActiveExpedition(outcome.nextExpedition);
    if (outcome.nextTiles !== stateRef.current.tiles) {
      const nextState = { ...stateRef.current, tiles: outcome.nextTiles };
      commitState(nextState);
    }
  }, [commitState]);

  const startExpedition = useCallback(async (): Promise<ExpeditionMode> => {
    clearSubscriptions();
    let mode: ExpeditionMode = "demo";
    try {
      if (Platform.OS === "web") {
        throw new Error("Web preview uses demo expeditions to avoid unsupported location subscription cleanup.");
      }
      const permissionGranted = await openLocation.requestPermissions();
      if (permissionGranted) {
        mode = "live";
      }
    } catch {
      mode = "demo";
    }

    const nextExpedition = createExpedition(mode, stateRef.current.momentum.currentStreak);
    setLatestReport(null);
    activeRef.current = nextExpedition;
    setActiveExpedition(nextExpedition);

    if (mode === "live") {
      const preference = stateRef.current.settings.trackingMode;
      const minimumDisplacement = preference === "precision" ? 5 : preference === "battery-saver" ? 15 : 8;
      openLocation.setMinDisplacement(minimumDisplacement);
      const listener: OpenLocationListener = (location) => {
        applyPoint({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy,
        });
      };
      locationListener.current = listener;
      openLocation.addListener(listener);

      try {
        const pedometerAvailable = await Pedometer.isAvailableAsync();
        if (pedometerAvailable) {
          await Pedometer.requestPermissionsAsync();
          pedometerSubscription.current = Pedometer.watchStepCount(({ steps }) => {
            const active = activeRef.current;
            if (!active) return;
            const next = { ...active, steps, notice: "Step update received" };
            activeRef.current = next;
            setActiveExpedition(next);
          });
        }
      } catch {
        // Distance remains the source of truth when a device blocks step access.
      }
    }
    await refreshCapabilities();
    return mode;
  }, [applyPoint, clearSubscriptions, refreshCapabilities]);

  const pauseExpedition = useCallback(() => {
    const active = activeRef.current;
    if (!active || active.status === "paused") return;
    const next = { ...active, status: "paused" as const, notice: "Expedition paused. Your route is safe." };
    activeRef.current = next;
    setActiveExpedition(next);
  }, []);

  const resumeExpedition = useCallback(() => {
    const active = activeRef.current;
    if (!active || active.status === "active") return;
    const next = { ...active, status: "active" as const, notice: "Expedition resumed." };
    activeRef.current = next;
    setActiveExpedition(next);
  }, []);

  const recordDemoDiscovery = useCallback(() => {
    const active = activeRef.current;
    if (!active || active.mode !== "demo" || active.status !== "active") return;
    const nextSequence = active.demoSequence + 1;
    activeRef.current = { ...active, demoSequence: nextSequence };
    applyPoint(createDemoPoint(nextSequence));
  }, [applyPoint]);

  const endExpedition = useCallback(async () => {
    const active = activeRef.current;
    if (!active) return;
    clearSubscriptions();
    const endedAt = Date.now();
    const contract = getDailyContract(endedAt);
    const contractProgress = getContractProgress(stateRef.current, contract, active, endedAt);
    const contractCompleted = contractProgress >= contract.target && !isContractClaimed(stateRef.current, contract);
    const contractRewardXp = contractCompleted ? contract.rewardXp : 0;
    const totalXpBefore = stateRef.current.profile.totalXp;
    const totalXpAfter = totalXpBefore + active.xpEarned + contractRewardXp;
    const unlockedAchievementIds = evaluateNewAchievements(stateRef.current, active, totalXpAfter, contractCompleted);
    const workout = {
      id: active.id,
      startedAt: active.startedAt,
      endedAt,
      mode: active.mode,
      distanceMeters: Math.round(active.distanceMeters),
      steps: active.steps,
      xpEarned: active.xpEarned,
      newTileCount: active.newTileIds.length,
      contractRewardXp,
      route: active.route,
      rulesetVersion: currentRuleset,
    };
    const momentum = advanceExplorerMomentum(stateRef.current.momentum, endedAt);
    const personalRecordUpdate = updatePersonalRecords(stateRef.current.personalRecords, workout);
    const nextState: RunQuestState = {
      ...stateRef.current,
      profile: {
        ...stateRef.current.profile,
        totalXp: totalXpAfter,
        title: resolveTitle(totalXpAfter),
        completedContractClaims: contractCompleted
          ? [...stateRef.current.profile.completedContractClaims, contract.claimKey].slice(-366)
          : stateRef.current.profile.completedContractClaims,
        achievements: unlockedAchievementIds.length
          ? [...stateRef.current.profile.achievements, ...unlockedAchievementIds.map((id) => ({ id, unlockedAt: endedAt }))].slice(-50)
          : stateRef.current.profile.achievements,
      },
      workouts: [workout, ...stateRef.current.workouts].slice(0, 200),
      momentum,
      personalRecords: personalRecordUpdate.records,
    };
    commitState(nextState, true);
    activeRef.current = null;
    setActiveExpedition(null);
    setLatestReport({ workout, contract, contractProgress, contractCompleted, totalXpBefore, totalXpAfter, unlockedAchievementIds, momentum, newPersonalRecordKinds: personalRecordUpdate.newRecordKinds, fieldBrief: active.fieldBrief });
  }, [clearSubscriptions, commitState]);

  const updateSettings = useCallback((patch: Partial<RunQuestState["settings"]>) => {
    commitState({ ...stateRef.current, settings: { ...stateRef.current.settings, ...patch } });
  }, [commitState]);

  const setMapStyleUrl = useCallback((mapStyleUrl: string) => {
    updateSettings({ mapProvider: "OpenFreeMap", mapStyleUrl });
  }, [updateSettings]);

  const downloadCurrentOfflineRegion = useCallback(async () => {
    setOfflineAction({ state: "ERROR", completed: 0, total: 0, message: "New offline downloads are paused until a provider that explicitly permits offline archives is configured." });
  }, []);

  const removeOfflineMapRegion = useCallback(async (id: string) => {
    const region = stateRef.current.offlineRegions.find((candidate) => candidate.id === id);
    if (!region) return;
    try {
      await removeOfflineRegion(region);
      const nextRegions = stateRef.current.offlineRegions.filter((candidate) => candidate.id !== id);
      commitState({ ...stateRef.current, offlineRegions: nextRegions, activeOfflineRegionId: stateRef.current.activeOfflineRegionId === id ? (nextRegions[0]?.id ?? null) : stateRef.current.activeOfflineRegionId }, true);
      setOfflineAction({ state: "IDLE", completed: 0, total: 0, message: "Offline Atlas pack removed." });
    } catch {
      setOfflineAction({ state: "ERROR", completed: 0, total: 0, message: "The Atlas pack could not be removed. Try again when storage is available." });
    }
  }, [commitState]);

  const setActiveOfflineRegion = useCallback((id: string | null) => {
    if (id !== null && !stateRef.current.offlineRegions.some((region) => region.id === id)) return;
    commitState({ ...stateRef.current, activeOfflineRegionId: id }, true);
    setOfflineAction({ state: "IDLE", completed: 0, total: 0, message: id ? "Active Atlas pack changed." : "Offline Atlas selection cleared." });
  }, [commitState]);

  const inspectOfflineRegionById = useCallback(async (id: string) => {
    const region = stateRef.current.offlineRegions.find((candidate) => candidate.id === id);
    return region ? inspectOfflineRegion(region) : null;
  }, []);

  const repairOfflineRegion = useCallback(async (id: string) => {
    const inspection = await inspectOfflineRegionById(id);
    if (!inspection) return;
    if (inspection.status === "READY") {
      setOfflineAction({ state: "IDLE", completed: inspection.presentTiles, total: inspection.expectedTiles, message: "Atlas pack verified and ready." });
      return;
    }
    setOfflineAction({ state: "ERROR", completed: inspection.presentTiles, total: inspection.expectedTiles, message: "This pack is incomplete. No files were changed; a permitted offline archive source is required for repair." });
  }, [inspectOfflineRegionById]);

  const inspectOfflineTerrainArchiveById = useCallback(async (id: string) => {
    const archive = stateRef.current.offlineArchives.find((candidate) => candidate.id === id);
    return archive ? inspectOfflineTerrainArchive(archive) : null;
  }, []);

  const importOfflineArchive = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/octet-stream", "application/x-sqlite3", "*/*"], copyToCacheDirectory: true });
      if (result.canceled) return;
      const archive = await importOfflineArchiveAsset(result.assets[0]);
      commitState({ ...stateRef.current, offlineArchives: [archive, ...stateRef.current.offlineArchives].slice(0, 8) }, true);
      setOfflineAction({ state: "IDLE", completed: 1, total: 1, message: `${archive.format} archive imported locally.` });
    } catch (error) {
      setOfflineAction({ state: "ERROR", completed: 0, total: 0, message: error instanceof Error ? error.message : "The archive could not be imported." });
    }
  }, [commitState]);

  const exportOfflineArchive = useCallback(async (id: string) => {
    const archive = stateRef.current.offlineArchives.find((candidate) => candidate.id === id);
    if (!archive) return;
    try {
      await shareOfflineArchive(archive);
      setOfflineAction({ state: "IDLE", completed: 1, total: 1, message: "Archive export sheet opened." });
    } catch (error) {
      setOfflineAction({ state: "ERROR", completed: 0, total: 0, message: error instanceof Error ? error.message : "The archive could not be exported." });
    }
  }, []);

  const removeImportedOfflineArchive = useCallback(async (id: string) => {
    const archive = stateRef.current.offlineArchives.find((candidate) => candidate.id === id);
    if (!archive) return;
    try {
      await removeOfflineArchive(archive);
      commitState({ ...stateRef.current, offlineArchives: stateRef.current.offlineArchives.filter((candidate) => candidate.id !== id) }, true);
      setOfflineAction({ state: "IDLE", completed: 0, total: 0, message: "Imported archive removed." });
    } catch (error) {
      setOfflineAction({ state: "ERROR", completed: 0, total: 0, message: error instanceof Error ? error.message : "The archive could not be removed." });
    }
  }, [commitState]);

  useEffect(() => () => {
    clearSubscriptions();
    if (persistTimer.current) clearTimeout(persistTimer.current);
    void flushPersistence();
  }, [clearSubscriptions, flushPersistence]);

  const value = useMemo<RunQuestContextValue>(() => ({
    hydrated,
    state,
    activeExpedition,
    latestReport,
    persistenceState,
    capabilities,
    refreshCapabilities,
    startExpedition,
    pauseExpedition,
    resumeExpedition,
    endExpedition,
    recordDemoDiscovery,
    dismissReport: () => setLatestReport(null),
    setTrackingMode: (trackingMode) => updateSettings({ trackingMode }),
    setHapticsEnabled: (hapticsEnabled) => updateSettings({ hapticsEnabled }),
    setReduceMotion: (reduceMotion) => updateSettings({ reduceMotion }),
    setMapStyleUrl,
    setTerrainOverlayEnabled: (terrainOverlayEnabled) => updateSettings({ terrainOverlayEnabled }),
    offlineAction,
    downloadCurrentOfflineRegion,
    removeOfflineRegion: removeOfflineMapRegion,
    setActiveOfflineRegion,
    inspectOfflineRegion: inspectOfflineRegionById,
    repairOfflineRegion,
    importOfflineArchive,
    exportOfflineArchive,
    removeOfflineArchive: removeImportedOfflineArchive,
    inspectOfflineTerrainArchive: inspectOfflineTerrainArchiveById,
  }), [activeExpedition, capabilities, downloadCurrentOfflineRegion, endExpedition, exportOfflineArchive, hydrated, importOfflineArchive, inspectOfflineRegionById, inspectOfflineTerrainArchiveById, latestReport, offlineAction, pauseExpedition, persistenceState, recordDemoDiscovery, refreshCapabilities, removeOfflineMapRegion, removeImportedOfflineArchive, repairOfflineRegion, resumeExpedition, setActiveOfflineRegion, setMapStyleUrl, startExpedition, state, updateSettings]);

  return <RunQuestContext.Provider value={value}>{children}</RunQuestContext.Provider>;
}

export function useRunQuest(): RunQuestContextValue {
  const context = useContext(RunQuestContext);
  if (!context) throw new Error("useRunQuest must be used inside RunQuestProvider");
  return context;
}
