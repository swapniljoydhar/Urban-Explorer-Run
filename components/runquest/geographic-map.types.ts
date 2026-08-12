import type { OfflineMapRegion, RoutePoint, TileRecord } from "@/lib/runquest/types";

export type GeographicMapProps = {
  route: RoutePoint[];
  tiles: TileRecord[];
  currentPoint?: RoutePoint | null;
  offlineRegion?: OfflineMapRegion | null;
  mapStyleUrl?: string;
  reduceMotion?: boolean;
};
