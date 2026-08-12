import type { RoutePoint, TileRecord } from "@/lib/runquest/types";

export type GeographicMapProps = {
  route: RoutePoint[];
  tiles: TileRecord[];
  currentPoint?: RoutePoint | null;
};
