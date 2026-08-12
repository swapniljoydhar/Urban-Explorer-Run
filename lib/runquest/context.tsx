import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";

import { inspectCapabilities } from "@/lib/runquest/capabilities";
import { createDemoPoint, createWorkoutId, currentRuleset, processLocationSample } from "@/lib/runquest/engine";
import { DEFAULT_RUNQUEST_STATE, loadRunQuestState, saveRunQuestState } from "@/lib/runquest/persistence";
import {
  type ActiveExpedition,
  type CapabilitySnapshot,
  type ExpeditionMode,
  type RoutePoint,
  type RunQuestState,
  type TrackingMode,
} from "@/lib/runquest/types";

type RunQuestContextValue = {
  hydrated: boolean;
  state: RunQuestState;
  activeExpedition: ActiveExpedition | null;
  capabilities: CapabilitySnapshot | null;
  refreshCapabilities: () => Promise<void>;
  startExpedition: () => Promise<ExpeditionMode>;
  pauseExpedition: () => void;
  resumeExpedition: () => void;
  endExpedition: () => Promise<void>;
  recordDemoDiscovery: () => void;
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
  const [capabilities, setCapabilities] = useState<CapabilitySnapshot | null>(null);
  const stateRef = useRef(state);
  const activeRef = useRef<ActiveExpedition | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pedometerSubscription = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    void Promise.all([loadRunQuestState(), inspectCapabilities()]).then(([persistedState, nextCapabilities]) => {
      stateRef.current = persistedState;
      setState(persistedState);
      setCapabilities(nextCapabilities);
      setHydrated(true);
    });
  }, []);

  const commitState = useCallback((nextState: RunQuestState) => {
    stateRef.current = nextState;
    setState(nextState);
    void saveRunQuestState(nextState);
  }, []);

  const refreshCapabilities = useCallback(async () => {
    setCapabilities(await inspectCapabilities());
  }, []);

  const clearSubscriptions = useCallback(() => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    pedometerSubscription.current?.remove();
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
      const permission = await Location.requestForegroundPermissionsAsync();
      const servicesEnabled = permission.status === "granted" && await Location.hasServicesEnabledAsync();
      if (servicesEnabled) {
        mode = "live";
      }
    } catch {
      mode = "demo";
    }

    const nextExpedition = createExpedition(mode);
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
    const workout = {
      id: active.id,
      startedAt: active.startedAt,
      endedAt,
      mode: active.mode,
      distanceMeters: Math.round(active.distanceMeters),
      steps: active.steps,
      xpEarned: active.xpEarned,
      newTileCount: active.newTileIds.length,
      route: active.route,
      rulesetVersion: currentRuleset,
    };
    const nextState: RunQuestState = {
      ...stateRef.current,
      profile: {
        ...stateRef.current.profile,
        totalXp: stateRef.current.profile.totalXp + active.xpEarned,
        title: stateRef.current.profile.totalXp + active.xpEarned >= 800 ? "Atlas Pathfinder" : "Neighborhood Scout",
      },
      workouts: [workout, ...stateRef.current.workouts].slice(0, 200),
    };
    commitState(nextState);
    activeRef.current = null;
    setActiveExpedition(null);
  }, [clearSubscriptions, commitState]);

  const updateSettings = useCallback((patch: Partial<RunQuestState["settings"]>) => {
    commitState({ ...stateRef.current, settings: { ...stateRef.current.settings, ...patch } });
  }, [commitState]);

  useEffect(() => () => clearSubscriptions(), [clearSubscriptions]);

  const value = useMemo<RunQuestContextValue>(() => ({
    hydrated,
    state,
    activeExpedition,
    capabilities,
    refreshCapabilities,
    startExpedition,
    pauseExpedition,
    resumeExpedition,
    endExpedition,
    recordDemoDiscovery,
    setTrackingMode: (trackingMode) => updateSettings({ trackingMode }),
    setHapticsEnabled: (hapticsEnabled) => updateSettings({ hapticsEnabled }),
    setReduceMotion: (reduceMotion) => updateSettings({ reduceMotion }),
  }), [activeExpedition, capabilities, endExpedition, hydrated, pauseExpedition, recordDemoDiscovery, refreshCapabilities, resumeExpedition, startExpedition, state, updateSettings]);

  return <RunQuestContext.Provider value={value}>{children}</RunQuestContext.Provider>;
}

export function useRunQuest(): RunQuestContextValue {
  const context = useContext(RunQuestContext);
  if (!context) throw new Error("useRunQuest must be used inside RunQuestProvider");
  return context;
}
