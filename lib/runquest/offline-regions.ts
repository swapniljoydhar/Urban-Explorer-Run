import type { OfflineMapRegion } from "@/lib/runquest/types";

export const OFFLINE_REGION_ZOOM = 14;
export const OFFLINE_REGION_RADIUS = 1;
export const MAX_OFFLINE_REGIONS = 4;
export const OFFLINE_REGION_TILE_COUNT = (OFFLINE_REGION_RADIUS * 2 + 1) ** 2;

export function toTileCoordinates(latitude: number, longitude: number, zoom = OFFLINE_REGION_ZOOM) {
  const boundedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const boundedLongitude = Math.max(-180, Math.min(180, longitude));
  const scale = 2 ** zoom;
  const x = Math.floor((boundedLongitude + 180) / 360 * scale);
  const radians = boundedLatitude * Math.PI / 180;
  const y = Math.floor((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * scale);
  return { x, y, zoom };
}

export function createOfflineRegion(latitude: number, longitude: number, createdAt = Date.now()): OfflineMapRegion {
  const center = toTileCoordinates(latitude, longitude);
  const id = `atlas-${center.zoom}-${center.x}-${center.y}`;
  return {
    id,
    latitude,
    longitude,
    zoom: center.zoom,
    tileCount: OFFLINE_REGION_TILE_COUNT,
    downloadedAt: createdAt,
    provider: "OpenStreetMap",
  };
}

export function offlineTileCoordinates(region: OfflineMapRegion) {
  const center = toTileCoordinates(region.latitude, region.longitude, region.zoom);
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  for (let x = center.x - OFFLINE_REGION_RADIUS; x <= center.x + OFFLINE_REGION_RADIUS; x += 1) {
    for (let y = center.y - OFFLINE_REGION_RADIUS; y <= center.y + OFFLINE_REGION_RADIUS; y += 1) {
      tiles.push({ x, y, z: region.zoom });
    }
  }
  return tiles;
}

export function getActiveOfflineRegion(state: { offlineRegions: OfflineMapRegion[]; activeOfflineRegionId: string | null }): OfflineMapRegion | null {
  if (state.activeOfflineRegionId) {
    return state.offlineRegions.find((region) => region.id === state.activeOfflineRegionId) ?? state.offlineRegions[0] ?? null;
  }
  return state.offlineRegions[0] ?? null;
}
