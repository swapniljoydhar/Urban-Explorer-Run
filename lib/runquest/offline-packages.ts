import { Platform } from "react-native";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as Network from "expo-network";
import * as Sharing from "expo-sharing";

import { createOfflineRegion, offlineTileCoordinates } from "@/lib/runquest/offline-regions";
import { getOfflineArchiveFormat, isManagedRunQuestArchiveUri } from "@/lib/runquest/archive-formats";
import { classifyPMTilesTerrain, parsePMTilesV3Header, type PMTilesTerrainInspection } from "@/lib/runquest/pmtiles-terrain";
import type { OfflineArchiveRecord, OfflineMapRegion } from "@/lib/runquest/types";

const CACHE_ROOT = "runquest-atlas/";
const MINIMUM_FREE_BYTES = 10 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 1024 * 1024 * 1024;
const ARCHIVE_ROOT = "runquest-archives/";

export type OfflineTerrainArchiveInspection = PMTilesTerrainInspection | { status: "MISSING" | "WEB_UNAVAILABLE"; message: string };

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

export function offlineTileUrlTemplate(region: OfflineMapRegion): string | null {
  const directory = offlineTileCachePath(region);
  return directory ? `${directory}{z}/{x}/{y}.png` : null;
}

export type OfflineRegionStatus = "READY" | "PARTIAL" | "MISSING" | "WEB_UNAVAILABLE";

export type OfflineRegionInspection = {
  status: OfflineRegionStatus;
  expectedTiles: number;
  presentTiles: number;
  bytes: number;
};

export async function inspectOfflineRegion(region: OfflineMapRegion): Promise<OfflineRegionInspection> {
  if (Platform.OS === "web") return { status: "WEB_UNAVAILABLE", expectedTiles: region.tileCount, presentTiles: 0, bytes: 0 };
  const coordinates = offlineTileCoordinates(region);
  let presentTiles = 0;
  let bytes = 0;
  for (const tile of coordinates) {
    const info = await FileSystem.getInfoAsync(`${regionDirectory(region)}${tile.z}/${tile.x}/${tile.y}.png`);
    if (info.exists) {
      presentTiles += 1;
      bytes += typeof info.size === "number" ? info.size : 0;
    }
  }
  return {
    status: presentTiles === 0 ? "MISSING" : presentTiles === coordinates.length ? "READY" : "PARTIAL",
    expectedTiles: coordinates.length,
    presentTiles,
    bytes,
  };
}

export async function offlineRegionStorageExists(region: OfflineMapRegion): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const info = await FileSystem.getInfoAsync(regionDirectory(region));
  return info.exists;
}

export async function offlineRegionExists(region: OfflineMapRegion): Promise<boolean> {
  return (await inspectOfflineRegion(region)).status === "READY";
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

function archiveDirectory(): string {
  if (!FileSystem.documentDirectory) throw new Error("This device does not expose persistent archive storage.");
  return `${FileSystem.documentDirectory}${ARCHIVE_ROOT}`;
}

function assertManagedArchiveUri(uri: string): void {
  if (!isManagedRunQuestArchiveUri(uri, archiveDirectory())) {
    throw new Error("This archive is outside RunQuest’s managed local storage and cannot be accessed.");
  }
}

function safeArchiveName(name: string, format: OfflineArchiveRecord["format"]): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96) || `runquest-archive.${format.toLowerCase()}`;
  return base.toLowerCase().endsWith(`.${format.toLowerCase()}`) ? base : `${base}.${format.toLowerCase()}`;
}

export async function importOfflineArchiveAsset(asset: { uri: string; name: string; size?: number | null }): Promise<OfflineArchiveRecord> {
  if (Platform.OS === "web") throw new Error("Archive imports are available in the Android and iOS app, not the browser preview.");
  const format = getOfflineArchiveFormat(asset.name);
  if (!format) throw new Error("Choose a .pmtiles or .mbtiles archive.");
  if (typeof asset.size === "number" && asset.size > MAX_ARCHIVE_BYTES) throw new Error("Archives larger than 1 GB are not supported on this device.");
  const directory = archiveDirectory();
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const id = `archive-${Date.now().toString(36)}`;
  const fileName = `${id}-${safeArchiveName(asset.name, format)}`;
  const destination = `${directory}${fileName}`;
  await FileSystem.copyAsync({ from: asset.uri, to: destination });
  const info = await FileSystem.getInfoAsync(destination);
  if (!info.exists || typeof info.size !== "number" || info.size <= 0) throw new Error("The selected archive could not be verified after copying.");
  if (info.size > MAX_ARCHIVE_BYTES) {
    await FileSystem.deleteAsync(destination, { idempotent: true });
    throw new Error("Archives larger than 1 GB are not supported on this device.");
  }
  return { id, name: asset.name, format, uri: destination, sizeBytes: info.size, importedAt: Date.now(), source: "Local file import" };
}

export async function removeOfflineArchive(archive: OfflineArchiveRecord): Promise<void> {
  if (Platform.OS === "web") return;
  assertManagedArchiveUri(archive.uri);
  await FileSystem.deleteAsync(archive.uri, { idempotent: true });
}

/** Reads only the fixed PMTiles header and a capped metadata block; tile payloads are never opened. */
export async function inspectOfflineTerrainArchive(archive: OfflineArchiveRecord): Promise<OfflineTerrainArchiveInspection> {
  if (Platform.OS === "web") return { status: "WEB_UNAVAILABLE", message: "Terrain archive inspection is available in Android and iOS builds, not the browser preview." };
  if (archive.format !== "PMTiles") return { status: "NOT_TERRAIN", message: "Only PMTiles archives can carry the validated Terrarium terrain metadata used by RunQuest." };
  try {
    assertManagedArchiveUri(archive.uri);
  } catch {
    return { status: "MISSING", message: "This archive is outside RunQuest’s managed local storage and cannot be inspected." };
  }
  const file = new File(archive.uri);
  if (!file.exists || file.size <= 0) return { status: "MISSING", message: "The imported PMTiles file is no longer available on this device." };
  const handle = file.open();
  try {
    const headerBytes = handle.readBytes(127);
    const headerResult = parsePMTilesV3Header(headerBytes, file.size);
    if (!headerResult.header) return headerResult;
    handle.offset = headerResult.header.metadataOffset;
    return classifyPMTilesTerrain(headerResult.header, handle.readBytes(headerResult.header.metadataLength));
  } catch {
    return { status: "INVALID_HEADER", message: "The PMTiles header could not be read safely." };
  } finally {
    handle.close();
  }
}

export async function shareOfflineArchive(archive: OfflineArchiveRecord): Promise<void> {
  if (Platform.OS === "web") throw new Error("Archive export is available in the Android and iOS app, not the browser preview.");
  if (!(await Sharing.isAvailableAsync())) throw new Error("File sharing is not available on this device.");
  assertManagedArchiveUri(archive.uri);
  const info = await FileSystem.getInfoAsync(archive.uri);
  if (!info.exists) throw new Error("The archive file is no longer available to export.");
  await Sharing.shareAsync(archive.uri, { dialogTitle: `Export ${archive.name}`, mimeType: archive.format === "PMTiles" ? "application/octet-stream" : "application/x-sqlite3" });
}
