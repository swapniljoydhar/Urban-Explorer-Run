import type { OfflineArchiveRecord } from "@/lib/runquest/types";

export function getOfflineArchiveFormat(name: string): OfflineArchiveRecord["format"] | null {
  const extension = name.toLowerCase().split(".").pop();
  return extension === "pmtiles" ? "PMTiles" : extension === "mbtiles" ? "MBTiles" : null;
}
