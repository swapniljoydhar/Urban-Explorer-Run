import type { OfflineArchiveRecord } from "@/lib/runquest/types";

export function getOfflineArchiveFormat(name: string): OfflineArchiveRecord["format"] | null {
  const extension = name.toLowerCase().split(".").pop();
  return extension === "pmtiles" ? "PMTiles" : extension === "mbtiles" ? "MBTiles" : null;
}

export function isManagedRunQuestArchiveUri(uri: string, root: string): boolean {
  if (!uri.startsWith(root)) return false;
  const relativePath = uri.slice(root.length);
  return relativePath.length > 0 && !relativePath.includes("/") && !relativePath.includes("\\");
}
