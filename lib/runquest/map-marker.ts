import type { RoutePoint } from "@/lib/runquest/types";

export type MarkerAccuracyBand = "excellent" | "good" | "fair" | "poor" | "unknown";
export type MarkerFollowMode = "following" | "free" | "paused";

export function getMarkerAccuracyBand(accuracy: number | null | undefined): MarkerAccuracyBand {
  if (!Number.isFinite(accuracy) || (accuracy ?? 0) <= 0) return "unknown";
  if ((accuracy as number) <= 15) return "excellent";
  if ((accuracy as number) <= 40) return "good";
  if ((accuracy as number) <= 100) return "fair";
  return "poor";
}

export function getAccuracyRadiusMeters(accuracy: number | null | undefined): number | null {
  if (!Number.isFinite(accuracy) || (accuracy ?? 0) <= 0) return null;
  return Math.min(150, Math.max(6, accuracy as number));
}

export function getMarkerColor(band: MarkerAccuracyBand): string {
  switch (band) {
    case "excellent": return "#35E0B8";
    case "good": return "#57C7FF";
    case "fair": return "#F5C451";
    case "poor": return "#FF7E66";
    default: return "#9AA9B5";
  }
}

export function createAccuracyFeature(point: RoutePoint | null | undefined): GeoJSON.Feature<GeoJSON.Polygon> | null {
  if (!point) return null;
  const radius = getAccuracyRadiusMeters(point.accuracy);
  if (!radius) return null;
  const latitude = point.latitude * Math.PI / 180;
  const longitude = point.longitude * Math.PI / 180;
  const earthRadius = 6_378_137;
  const angularDistance = radius / earthRadius;
  const coordinates: [number, number][] = [];
  for (let index = 0; index <= 32; index += 1) {
    const bearing = index / 32 * Math.PI * 2;
    const lat = Math.asin(Math.sin(latitude) * Math.cos(angularDistance) + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing));
    const lon = longitude + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude), Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(lat));
    coordinates.push([lon * 180 / Math.PI, lat * 180 / Math.PI]);
  }
  return { type: "Feature", properties: { band: getMarkerAccuracyBand(point.accuracy), radius }, geometry: { type: "Polygon", coordinates: [coordinates] } };
}

export function canFollowCamera(mode: MarkerFollowMode, hasPoint: boolean): boolean {
  return mode === "following" && hasPoint;
}

export function shouldInterruptFollow(userInteraction: boolean, mode: MarkerFollowMode): boolean {
  return userInteraction && mode === "following";
}
