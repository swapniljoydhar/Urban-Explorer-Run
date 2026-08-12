import { PermissionsAndroid, Platform } from "react-native";
import { Pedometer } from "expo-sensors";

import type { CapabilitySnapshot, RunQuestCapability } from "@/lib/runquest/types";

const available = (label: string, detail: string): RunQuestCapability => ({ state: "AVAILABLE", label, detail });
const limited = (label: string, detail: string): RunQuestCapability => ({ state: "LIMITED", label, detail });
const unavailable = (label: string, detail: string): RunQuestCapability => ({ state: "UNAVAILABLE", label, detail });
const blocked = (label: string, detail: string): RunQuestCapability => ({ state: "BLOCKED_BY_USER", label, detail });

export async function inspectCapabilities(): Promise<CapabilitySnapshot> {
  const offline = available("Local atlas", "Your expeditions, map cells, and progression are stored on this device.");
  const haptics = Platform.OS === "web"
    ? limited("Haptic feedback", "Visual feedback is active; haptics depend on the browser and device.")
    : available("Haptic feedback", "Short discovery and control feedback is available when enabled.");

  if (Platform.OS === "web") {
    return {
      location: limited("Foreground location", "The browser preview uses safe demo expeditions. Live GPS runs are available in the Android build."),
      steps: unavailable("Step sensor", "Step sensing is not exposed in this web preview."),
      background: unavailable("Background tracking", "A device build is required for background tracking."),
      haptics,
      offline,
    };
  }

  try {
    const [fineGranted, coarseGranted, pedometerAvailable] = await Promise.all([
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION),
      Pedometer.isAvailableAsync(),
    ]);

    const location = !(fineGranted || coarseGranted)
      ? blocked("Foreground location", "Allow location when you start an expedition for live tracking. Demo mode is always available.")
      : available("Foreground location", fineGranted ? "Live foreground tracking is ready with precise location." : "Approximate location is available; discovery precision may be reduced.");

    const steps = pedometerAvailable
      ? available("Step sensor", "Hardware step updates can supplement distance tracking while the app is open.")
      : limited("Step sensor", "This device does not expose a supported pedometer. RunQuest uses route distance instead.");

    return {
      location,
      steps,
      background: limited("Background tracking", "This first build prioritizes reliable foreground expeditions. Background tracking is a future capability gate."),
      haptics,
      offline,
    };
  } catch {
    return {
      location: limited("Foreground location", "Location status could not be checked. Demo mode remains available."),
      steps: limited("Step sensor", "Sensor status could not be checked; route distance remains available."),
      background: unavailable("Background tracking", "Background tracking is unavailable until device capabilities are confirmed."),
      haptics,
      offline,
    };
  }
}
