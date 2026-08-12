import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Network from "expo-network";

import { createOfflineRegion, offlineTileCoordinates } from "@/lib/runquest/offline-regions";
import type { OfflineMapRegion } from "@/lib/runquest/types";

const CACHE_ROOT = "runquest-atlas/";
const MINIMUM_FREE_BYTES = 10 * 1024 * 1024;

function rootDirectory(): string {
  if (!FileSystem.documentDirectory) throw new Error("This device does not expose persistent package storage.");
  return `${FileSystem.documentDirectory}${CACHE_ROOT}`;
}

function regionDirectory(region: OfflineMapRegion): string {
  return `${rootDirectory()}${region.id}/`;
}

export function offlineTileCachePath(region: OfflineMapRegion): string | null {
  if (Platform.OS === "web") return null;
  return regionDirectory(region);
}

export function offlineTilePathTemplate(region: OfflineMapRegion): string | null {
  const directory = offlineTileCachePath(region);
  return directory ? `${directory.replace(/^file:\/\//, "")}{z}/{x}/{y}.png` : null;
}

export async function offlineRegionExists(region: OfflineMapRegion): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const info = await FileSystem.getInfoAsync(regionDirectory(region));
  return info.exists;
}

export async function downloadOfflineRegion(
  latitude: number,
  longitude: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<OfflineMapRegion> {
  if (Platform.OS === "web") throw new Error("Offline map packs are available in Android and iOS builds, not in the browser preview.");
  const network = await Network.getNetworkStateAsync();
  if (network.isInternetReachable !== true) throw new Error("Connect to the internet before preparing an offline Atlas pack.");
  const freeBytes = await FileSystem.getFreeDiskStorageAsync();
  if (freeBytes < MINIMUM_FREE_BYTES) throw new Error("Free at least 10 MB of storage before preparing an offline Atlas pack.");

  const region = createOfflineRegion(latitude, longitude);
  const directory = regionDirectory(region);
  const tiles = offlineTileCoordinates(region);
  await FileSystem.deleteAsync(directory, { idempotent: true });
  try {
    for (let index = 0; index < tiles.length; index += 1) {
      const tile = tiles[index];
      const tileDirectory = `${directory}${tile.z}/${tile.x}/`;
      await FileSystem.makeDirectoryAsync(tileDirectory, { intermediates: true });
      await FileSystem.downloadAsync(`https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`, `${tileDirectory}${tile.y}.png`);
      onProgress?.(index + 1, tiles.length);
    }
    return region;
  } catch (error) {
    await FileSystem.deleteAsync(directory, { idempotent: true });
    throw error;
  }
}

export async function removeOfflineRegion(region: OfflineMapRegion): Promise<void> {
  if (Platform.OS === "web") return;
  await FileSystem.deleteAsync(regionDirectory(region), { idempotent: true });
}
