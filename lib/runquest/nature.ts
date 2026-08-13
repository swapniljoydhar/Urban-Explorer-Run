import type { ComponentProps } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
