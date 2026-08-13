import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

function canUseHaptics(enabled: boolean): boolean {
  return enabled && Platform.OS !== "web";
}

export function lightFeedback(enabled: boolean): void {
  if (canUseHaptics(enabled)) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function mediumFeedback(enabled: boolean): void {
  if (canUseHaptics(enabled)) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function successFeedback(enabled: boolean): void {
  if (canUseHaptics(enabled)) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Pace cues are intentionally subtle and are disabled when reduced motion is requested. */
export function paceCoachingFeedback(enabled: boolean, reduceMotion: boolean): void {
  if (canUseHaptics(enabled) && !reduceMotion) void Haptics.selectionAsync();
}
