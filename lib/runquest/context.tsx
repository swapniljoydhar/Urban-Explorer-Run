import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";

import { inspectCapabilities } from "@/lib/runquest/capabilities";
import { getContractProgress, getDailyContract, isContractClaimed } from "@/lib/runquest/contracts";
import { createDemoPoint, createWorkoutId, currentRuleset, processLocationSample, resolveTitle } from "@/lib/runquest/engine";
import { DEFAULT_RUNQUEST_STATE, loadRunQuestState, saveRunQuestState } from "@/lib/runquest/persistence";
import { safelyRemoveSubscription } from "@/lib/runquest/subscriptions";
import {
  type ActiveExpedition,
  type CapabilitySnapshot,
  type ExpeditionReport,
  type ExpeditionMode,
  type RoutePoint,
  type RunQuestState,
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
};

const RunQuestContext = createContext<RunQuestContextValue | null>(null);

function createExpedition(mode: ExpeditionMode): ActiveExpedition {
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
  };
}

export function RunQuestProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<RunQuestState>(DEFAULT_RUNQUEST_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [activeExpedition, setActiveExpedition] = useState<ActiveExpedition | null>(null);
  const [latestReport, setLatestReport] = useState<ExpeditionReport | null>(null);
  const [persistenceState, setPersistenceState] = useState<"SAVED" | "SAVING" | "PENDING">("SAVED");
  const [capabilities, setCapabilities] = useState<CapabilitySnapshot | null>(null);
  const stateRef = useRef(state);
  const activeRef = useRef<ActiveExpedition | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pedometerSubscription = useRef<{ remove: () => void } | null>(null);
  const pendingPersist = useRef<RunQuestState | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistenceInFlight = useRef(false);

  useEffect(() => {
    void Promise.all([loadRunQuestState(), inspectCapabilities()]).then(([persistedState, nextCapabilities]) => {
      stateRef.current = persistedState;
      setState(persistedState);
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
    safelyRemoveSubscription(locationSubscription.current, Platform.OS);
    locationSubscription.current = null;
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
      const permission = await Location.requestForegroundPermissionsAsync();
      const servicesEnabled = permission.status === "granted" && await Location.hasServicesEnabledAsync();
      if (servicesEnabled) {
        mode = "live";
      }
    } catch {
      mode = "demo";
    }

    const nextExpedition = createExpedition(mode);
    setLatestReport(null);
    activeRef.current = nextExpedition;
    setActiveExpedition(nextExpedition);

    if (mode === "live") {
      const preference = stateRef.current.settings.trackingMode;
      const options = preference === "precision"
        ? { accuracy: Location.Accuracy.High, timeInterval: 2_500, distanceInterval: 5 }
        : preference === "battery-saver"
          ? { accuracy: Location.Accuracy.Balanced, timeInterval: 8_000, distanceInterval: 15 }
          : { accuracy: Location.Accuracy.Balanced, timeInterval: 4_000, distanceInterval: 8 };

      locationSubscription.current = await Location.watchPositionAsync(options, (location) => {
        applyPoint({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy,
        });
      });

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
    const nextState: RunQuestState = {
      ...stateRef.current,
      profile: {
        ...stateRef.current.profile,
        totalXp: totalXpAfter,
        title: resolveTitle(totalXpAfter),
        completedContractClaims: contractCompleted
          ? [...stateRef.current.profile.completedContractClaims, contract.claimKey].slice(-366)
          : stateRef.current.profile.completedContractClaims,
      },
      workouts: [workout, ...stateRef.current.workouts].slice(0, 200),
    };
    commitState(nextState, true);
    activeRef.current = null;
    setActiveExpedition(null);
    setLatestReport({ workout, contract, contractProgress, contractCompleted, totalXpBefore, totalXpAfter });
  }, [clearSubscriptions, commitState]);

  const updateSettings = useCallback((patch: Partial<RunQuestState["settings"]>) => {
    commitState({ ...stateRef.current, settings: { ...stateRef.current.settings, ...patch } });
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
  }), [activeExpedition, capabilities, endExpedition, hydrated, latestReport, pauseExpedition, persistenceState, recordDemoDiscovery, refreshCapabilities, resumeExpedition, startExpedition, state, updateSettings]);

  return <RunQuestContext.Provider value={value}>{children}</RunQuestContext.Provider>;
}

export function useRunQuest(): RunQuestContextValue {
  const context = useContext(RunQuestContext);
  if (!context) throw new Error("useRunQuest must be used inside RunQuestProvider");
  return context;
}
