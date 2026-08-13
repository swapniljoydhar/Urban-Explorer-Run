export const PMTILES_V3_HEADER_BYTES = 127;
export const MAX_PMTILES_METADATA_BYTES = 64 * 1024;

export type PMTilesHeader = {
  metadataOffset: number;
  metadataLength: number;
  tileType: number;
  minZoom: number;
  maxZoom: number;
};

export type PMTilesTerrainStatus = "VALID_TERRAIN" | "NOT_TERRAIN" | "INVALID_HEADER" | "TRUNCATED" | "UNSUPPORTED";

export type PMTilesTerrainInspection = {
  status: PMTilesTerrainStatus;
  message: string;
  header?: PMTilesHeader;
  name?: string;
  attribution?: string;
};

function readBoundedUint64(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 8 > bytes.length) return null;
  // RunQuest archives are capped at 1 GB. Reject a field outside a safe 32-bit
  // range instead of using BigInt, which keeps this helper predictable on Android 7.
  if (bytes[offset + 4] || bytes[offset + 5] || bytes[offset + 6] || bytes[offset + 7]) return null;
  return bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65_536 + bytes[offset + 3] * 16_777_216;
}

export function parsePMTilesV3Header(bytes: Uint8Array, archiveBytes: number): PMTilesTerrainInspection {
  if (bytes.length < PMTILES_V3_HEADER_BYTES) return { status: "TRUNCATED", message: "The archive is smaller than the required PMTiles v3 header." };
  const magic = "PMTiles".split("").every((character, index) => bytes[index] === character.charCodeAt(0));
  if (!magic) return { status: "INVALID_HEADER", message: "The archive does not contain the PMTiles signature." };
  if (bytes[7] !== 3) return { status: "UNSUPPORTED", message: `PMTiles version ${bytes[7]} is not supported; RunQuest validates version 3 archives.` };
  const rootOffset = readBoundedUint64(bytes, 8);
  const rootLength = readBoundedUint64(bytes, 16);
  const metadataOffset = readBoundedUint64(bytes, 24);
  const metadataLength = readBoundedUint64(bytes, 32);
  const tileDataOffset = readBoundedUint64(bytes, 56);
  const tileDataLength = readBoundedUint64(bytes, 64);
  if ([rootOffset, rootLength, metadataOffset, metadataLength, tileDataOffset, tileDataLength].some((value) => value === null)) return { status: "INVALID_HEADER", message: "The PMTiles header contains an out-of-range section address." };
  const safeRootOffset = rootOffset as number;
  const safeRootLength = rootLength as number;
  const safeMetadataOffset = metadataOffset as number;
  const safeMetadataLength = metadataLength as number;
  const safeTileDataOffset = tileDataOffset as number;
  const safeTileDataLength = tileDataLength as number;
  if (safeRootOffset < PMTILES_V3_HEADER_BYTES || safeRootLength <= 0 || safeRootOffset + safeRootLength > 16_384) return { status: "INVALID_HEADER", message: "The PMTiles root directory is outside the required header window." };
  if (safeMetadataOffset < PMTILES_V3_HEADER_BYTES || safeMetadataLength <= 0 || safeMetadataLength > MAX_PMTILES_METADATA_BYTES || safeMetadataOffset + safeMetadataLength > archiveBytes) return { status: "INVALID_HEADER", message: "The PMTiles metadata section is missing, oversized, or outside the archive." };
  if (safeTileDataOffset < PMTILES_V3_HEADER_BYTES || safeTileDataLength <= 0 || safeTileDataOffset + safeTileDataLength > archiveBytes) return { status: "INVALID_HEADER", message: "The PMTiles tile-data section is outside the archive." };
  const minZoom = bytes[100];
  const maxZoom = bytes[101];
  if (minZoom > maxZoom || maxZoom > 22) return { status: "INVALID_HEADER", message: "The PMTiles zoom range is invalid." };
  return { status: "NOT_TERRAIN", message: "PMTiles header is structurally valid; terrain metadata has not yet been read.", header: { metadataOffset: safeMetadataOffset, metadataLength: safeMetadataLength, tileType: bytes[99], minZoom, maxZoom } };
}

export function classifyPMTilesTerrain(header: PMTilesHeader, metadataBytes: Uint8Array): PMTilesTerrainInspection {
  if (metadataBytes.length !== header.metadataLength) return { status: "TRUNCATED", message: "The PMTiles metadata block is incomplete.", header };
  if (header.tileType !== 2) return { status: "NOT_TERRAIN", message: "Terrain archives must use lossless PNG raster tiles.", header };
  try {
    const metadata = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(metadataBytes)) as Record<string, unknown>;
    if (metadata.encoding !== "terrarium") return { status: "NOT_TERRAIN", message: "The PMTiles metadata does not declare Terrarium terrain encoding.", header };
    return {
      status: "VALID_TERRAIN",
      message: "Terrarium terrain metadata is valid. The archive is ready for a future local rendering proof-of-concept.",
      header,
      name: typeof metadata.name === "string" ? metadata.name.slice(0, 128) : undefined,
      attribution: typeof metadata.attribution === "string" ? metadata.attribution.slice(0, 512) : undefined,
    };
  } catch {
    return { status: "INVALID_HEADER", message: "The PMTiles metadata is not valid UTF-8 JSON.", header };
  }
}
