import type { ComponentProps } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import type { FieldBrief } from "@/lib/runquest/types";

export type NatureMoment = {
  phase: "DAWN" | "DAY" | "GOLDEN_HOUR" | "NIGHT";
  title: string;
  shortLabel: string;
  cue: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
  accent: string;
};

/**
 * A local, privacy-preserving ambience cue. This intentionally reports only device-time
 * context; it does not infer weather, daylight accuracy, location, or environmental safety.
 */
export function getNatureMoment(timestamp = Date.now()): NatureMoment {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 8) {
    return { phase: "DAWN", title: "Dawn window", shortLabel: "DAWN", cue: "A quiet start. Let your pace settle before the atlas opens outward.", icon: "wb-sunny", accent: "#F6C768" };
  }
  if (hour >= 17 && hour < 20) {
    return { phase: "GOLDEN_HOUR", title: "Golden-hour window", shortLabel: "GOLDEN HOUR", cue: "A good time for one unhurried field loop and a clean finish.", icon: "wb-twilight", accent: "#F59E72" };
  }
  if (hour >= 20 || hour < 5) {
    return { phase: "NIGHT", title: "Night field window", shortLabel: "NIGHT", cue: "Keep the route familiar, visible, and comfortably within your limits.", icon: "nights-stay", accent: "#A6B7FF" };
  }
  return { phase: "DAY", title: "Daylight window", shortLabel: "DAYLIGHT", cue: "Build the atlas a little at a time. A steady route counts as progress.", icon: "filter-hdr", accent: "#72D6A4" };
}

export function getExpeditionStory(timestamp: number, newTileCount: number): string {
  const moment = getNatureMoment(timestamp);
  if (newTileCount > 0) return `${moment.title} carried your route into new ground.`;
  return `${moment.title} held a familiar path in the local atlas.`;
}

/** Original local story prompt; no account, network, voice service, or copied scripted content is involved. */
export function getFieldBrief(timestamp: number, currentStreak: number): FieldBrief {
  const moment = getNatureMoment(timestamp);
  const momentumCue = currentStreak >= 2
    ? `This can become field day ${currentStreak + 1}; a steady loop is enough.`
    : "Choose a comfortable loop and let the first few minutes set the tone.";

  if (moment.phase === "DAWN") return { title: "First light survey", objective: "Open one quiet line in the atlas.", cue: momentumCue };
  if (moment.phase === "GOLDEN_HOUR") return { title: "Warm-path survey", objective: "Carry the fieldwork calmly toward a clean finish.", cue: momentumCue };
  if (moment.phase === "NIGHT") return { title: "Lantern route", objective: "Keep to familiar, visible ground and finish with margin.", cue: "Safety and comfort outrank every reward tonight." };
  return { title: "Daytrail survey", objective: "Build one small piece of your living atlas.", cue: momentumCue };
}

export function getMomentumDebrief(newTileCount: number, currentStreak: number, newRecordCount: number): string {
  if (newRecordCount > 0) return "A fresh personal best is now marked in your field ledger.";
  if (currentStreak >= 2) return `Field rhythm holds at ${currentStreak} days. Your atlas grows through return, not rush.`;
  if (newTileCount > 0) return "New ground is noted. The next path can begin wherever curiosity points.";
  return "A familiar route still strengthens the field record. Recovery and consistency both count.";
}
