import type { RunQuestSettings } from "@/lib/runquest/types";

export const OPENFREEMAP_PROVIDER_ID = "OpenFreeMap" as const;
export const LEGACY_OSM_PROVIDER_ID = "OpenStreetMap" as const;
export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const OPENFREEMAP_ATTRIBUTION = "OpenFreeMap © OpenMapTiles · Data from OpenStreetMap";
export const OPENFREEMAP_LICENSE_URL = "https://openfreemap.org/";

export type TileProviderId = typeof OPENFREEMAP_PROVIDER_ID | typeof LEGACY_OSM_PROVIDER_ID;

export type TileProviderDefinition = {
  id: TileProviderId;
  label: string;
  styleUrl: string | null;
  attribution: string;
  licenseUrl: string;
  supportsOnline: boolean;
  supportsOfflinePrefetch: boolean;
  offlineNote: string;
};

export const OPENFREEMAP_PROVIDER: TileProviderDefinition = {
  id: OPENFREEMAP_PROVIDER_ID,
  label: "OpenFreeMap Liberty",
  styleUrl: OPENFREEMAP_STYLE_URL,
  attribution: OPENFREEMAP_ATTRIBUTION,
  licenseUrl: OPENFREEMAP_LICENSE_URL,
  supportsOnline: true,
  supportsOfflinePrefetch: false,
  offlineNote: "The public style is online-only for RunQuest downloads. Offline packs require a permitted self-hosted or supplied OpenFreeMap archive.",
};

export const LEGACY_OSM_PROVIDER: TileProviderDefinition = {
  id: LEGACY_OSM_PROVIDER_ID,
  label: "OpenStreetMap legacy pack",
  styleUrl: null,
  attribution: "© OpenStreetMap contributors",
  licenseUrl: "https://www.openstreetmap.org/copyright",
  supportsOnline: true,
  supportsOfflinePrefetch: false,
  offlineNote: "Existing packs remain readable. New public OSM raster prefetch is disabled because the tile policy does not permit offline downloads.",
};

export function getTileProvider(provider: TileProviderId): TileProviderDefinition {
  return provider === OPENFREEMAP_PROVIDER_ID ? OPENFREEMAP_PROVIDER : LEGACY_OSM_PROVIDER;
}

export function normalizeHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 512 || !trimmed.startsWith("https://")) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeMapStyleUrl(value: string): string | null {
  return normalizeHttpsUrl(value);
}

export function getConfiguredStyleUrl(settings: RunQuestSettings): string {
  return settings.mapStyleUrl ?? OPENFREEMAP_STYLE_URL;
}
