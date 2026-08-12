# RunQuest Offline-Map Archive Strategy

**Status:** Design exploration only. No application source code, dependency, configuration, asset, or saved-state schema has been changed.

## Executive recommendation

RunQuest should separate **the user experience of managing an offline region** from **the physical archive format used to store its map resources**. Organic Maps demonstrates the right product principles: the user chooses a meaningful region, sees its size and state, receives reliable offline feedback, can update or remove it, and is never forced to create an account or depend on a cloud sync service.[1]

For the next safe milestone, the recommended format is a **provider-aware, transactional XYZ directory pack with a manifest**. It is the least disruptive option for the current Expo/React Native implementation, Android API 24, and existing 3×3 packs. It permits incremental downloads, resumable progress, per-tile verification, explicit deletion, and forward migration without adding SQLite, native archive readers, a local HTTP server, or a second map engine.

For a later large-region milestone, RunQuest should evaluate **PMTiles or a provider-supplied vector archive**, but only after proving that the targeted MapLibre Native Android build can read the chosen local source efficiently. PMTiles is read-only and optimized around HTTP Range Requests; it is excellent for distribution and remote access, but it is not automatically a drop-in local file source for the installed React Native MapLibre integration.[3]

> **Recommendation in one sentence:** Ship an Organic Maps-style UX over a versioned provider-aware directory-pack abstraction now; keep PMTiles/vector archives behind a future archive adapter and never bulk-prefetch from the public OpenStreetMap raster tile server.

## Non-negotiable constraints

| Constraint | Consequence for archive design |
|---|---|
| Google-free app layer | No Google Maps, Firebase, Play Services location, or Google-specific offline database. |
| Android API 24 minimum | Avoid requiring a new native storage engine or modern Android-only filesystem API for the first milestone. |
| Local-first | The authoritative pack manifest and status remain on-device. No account or cloud sync is needed. |
| Backward compatibility | Existing `OfflineMapRegion` records and tile identities remain readable. New archive metadata must be optional or migrated forward. |
| Low RAM | Do not load a whole archive, tile set, or bitmap atlas into JavaScript memory. Download and verify one bounded tile/file at a time. |
| Policy compliance | `tile.openstreetmap.org` must not be used for bulk download, prefetch, or offline packs. OSM’s policy explicitly disallows offline use there and requires an alternative permitted provider or self-hosting.[4] |
| MapLibre Native | Prefer MapLibre’s own offline-pack APIs where they match the selected provider and style. Its `OfflineManager` supports create, progress/error listeners, invalidate, delete, pack enumeration, and listener removal.[2] |
| Attribution | The active source, license, and attribution must be visible on the map and in the region details. OSM attribution must not be hidden under controls or off-screen.[4] |

## Archive options

### Option A — Provider-aware XYZ directory pack

Each installed region is a directory containing `z/x/y` resources and a small manifest. The manifest is written to a temporary file and atomically renamed after a successful download or verified refresh. A pack is only considered **READY** after every expected resource has passed existence and non-zero-size checks.

| Dimension | Assessment |
|---|---|
| Android/API 24 | Excellent. Uses the existing filesystem and does not require a new native database. |
| Random access | Excellent. MapLibre can resolve one local tile at a time without opening a large archive. |
| Incremental/resumable updates | Excellent. Each tile has an independent status and can be retried. |
| Storage overhead | Moderate for many small raster files; acceptable for the current bounded packs. |
| RAM | Very good. No whole-archive load is required. |
| Migration risk | Lowest. It maps directly to the existing implementation. |
| Large-region scalability | Moderate. File-count overhead eventually becomes significant. |
| Recommendation | **Use now**, with a formal `xyz-directory-v1` manifest and provider policy metadata. |

This is not intended to remain a 3×3-only limitation forever. The directory abstraction can later support a larger bounded region, but the provider must explicitly permit offline/prefetch use and the app must enforce storage and tile-count limits.

### Option B — Compressed ZIP or TAR pack

A compressed archive is attractive because it looks like a single portable file and may reduce filesystem metadata overhead. However, MapLibre Native does not automatically resolve arbitrary ZIP entries as map resources. RunQuest would need to extract the archive before rendering, which temporarily requires both the compressed source and the extracted directory. Random tile access, pause/resume, repair, and update-in-place are also awkward.

| Dimension | Assessment |
|---|---|
| Android/API 24 | Possible, but adds archive extraction and temporary-space failure modes. |
| Random access | Poor unless a separate index and random-access reader are added. |
| Resume/update | Poor. A changed tile generally requires rewriting or re-extracting the archive. |
| RAM | Potentially acceptable with streaming extraction, but easy to misuse. |
| Migration risk | Medium to high because the map renderer still needs an extracted layout. |
| Recommendation | **Do not use as the primary runtime format.** It could be an export/import format later. |

### Option C — MBTiles SQLite database

MBTiles is a mature specification for storing raster or vector tiles in SQLite and supports a single tileset with metadata.[5] It provides strong random access and is a natural archive for large offline packs. The main issue is integration: the current app uses Expo filesystem files and MapLibre Native style sources, not a native MBTiles reader exposed to the JavaScript layer. Adding MBTiles would require either a native MapLibre-compatible bridge, a local HTTP server, or a renderer-specific adapter.

| Dimension | Assessment |
|---|---|
| Android/API 24 | Good in principle; SQLite is widely available, but the required bridge is a new native surface. |
| Random access | Excellent. |
| Incremental/resumable updates | Moderate. SQLite transactions are strong, but tile updates require database writes and careful locking. |
| Storage overhead | Good for large tile collections. |
| RAM | Good if queries are bounded; poor if an implementation materializes tile blobs or query results. |
| Migration risk | Medium to high for an Expo app unless a supported native path is proven. |
| Recommendation | **Evaluate for v2 large packs**, not for the first requested management UI. |

### Option D — PMTiles archive

PMTiles is a single-file archive for tiled data. Its readers use HTTP Range Requests to read only relevant metadata or tile sections, and its format is read-only: an update requires rewriting the archive.[3] That makes PMTiles compelling for immutable, provider-generated regions and efficient distribution, but less suitable for a user-managed tile-by-tile download that must pause, repair, or update in place.

| Dimension | Assessment |
|---|---|
| Android/API 24 | Unknown for the installed MapLibre Native path; requires a targeted proof-of-concept. |
| Random access | Excellent when a range-capable reader/source exists. |
| Incremental/resumable updates | Poor inside one archive; strong if the archive is downloaded as a resumable file. |
| Storage overhead | Excellent for large immutable regions. |
| RAM | Potentially excellent with bounded range reads; implementation-dependent on native support. |
| Migration risk | High if introduced without a local source adapter and legacy-pack fallback. |
| Recommendation | **Best long-term candidate for hosted immutable vector regions; do not make it the first runtime format.** |

### Option E — Provider-supplied vector map region

A vector region is the closest technical direction to a mature offline navigation product: one compact dataset plus a style can render multiple zoom levels and themes. It can reduce the number of raster images and permit a richer dark/light map style. The cost is substantial: the provider must supply licensed vector data, the style must be packaged and attributed, and the targeted MapLibre Native build must render the source offline.

| Dimension | Assessment |
|---|---|
| Android/API 24 | Feasible but requires a verified native style/source path. |
| Random access | Very good when the archive format is designed for it. |
| Updates | Usually archive replacement, not tile-by-tile mutation. |
| Storage/RAM | Often better than multi-zoom raster, but depends on source and style. |
| UX potential | Highest: themes, labels, contours, and richer map semantics. |
| Recommendation | **Long-term strategic direction**, not a prerequisite for current marker or pack-management work. |

### Option F — Self-hosted permitted raster/vector tile service

Self-hosting is not an archive format by itself, but it is the policy foundation for a reliable offline pipeline. A controlled server can generate or serve tiles under a known license and permit a bounded offline pack. The tradeoff is operations: hosting, updates, bandwidth, availability, and data licensing become RunQuest responsibilities.

| Dimension | Assessment |
|---|---|
| Policy | Strongest control when the data and terms are owned or explicitly permitted. |
| Runtime | Works with MapLibre style URLs and provider adapters. |
| User privacy | Can be configured without analytics or account requirements. |
| Operational cost | Highest. Requires hosting and map-data maintenance. |
| Recommendation | **Preferred source model for large offline regions**, if the project is ready to operate it; otherwise use a documented provider that explicitly allows offline use. |

## Weighted decision matrix

Scores use a 1–5 scale, where 5 is strongest for RunQuest’s immediate constraints. Policy compliance is a gate: a high technical score cannot rescue a provider that prohibits offline prefetch.

| Strategy | API 24 / Expo fit | Random access | Resumability | Low-RAM potential | Migration safety | Large-region future | Immediate decision |
|---|---:|---:|---:|---:|---:|---:|---|
| XYZ directory + manifest | 5 | 5 | 5 | 5 | 5 | 3 | **Select now** |
| ZIP/TAR runtime archive | 4 | 2 | 2 | 3 | 3 | 3 | Do not select |
| MBTiles | 3 | 5 | 3 | 4 | 3 | 4 | Investigate later |
| PMTiles | 2 until native proof | 5 | 2 | 4 | 2 | 5 | Strategic v2 candidate |
| Vector region package | 2–3 | 4 | 2 | 4 | 2 | 5 | Strategic v2 candidate |
| Self-hosted provider | 3 | Depends | Depends | Depends | 3 | 5 | Source/infrastructure option |

The decision is intentionally conservative. **A reliable smaller pack is preferable to a theoretically superior archive that cannot be rendered, repaired, or migrated on the minimum supported device.**

## Recommended archive abstraction

The app should treat an offline region as a logical resource independent of its physical storage format. The first adapter is `xyz-directory-v1`; future adapters can implement `mbtiles-v1` or `pmtiles-v3` without changing the region-management UI.

```ts
type OfflineArchiveFormat = "xyz-directory-v1" | "mbtiles-v1" | "pmtiles-v3";
type OfflinePackStatus =
  | "DISCOVERED"
  | "DOWNLOADING"
  | "PAUSED"
  | "VERIFYING"
  | "READY"
  | "STALE"
  | "CORRUPT"
  | "FAILED";

type OfflinePackManifest = {
  manifestVersion: 1;
  regionId: string;
  format: OfflineArchiveFormat;
  providerId: string;
  providerUrlTemplate: string;
  attribution: string;
  licenseUrl?: string;
  offlineAllowed: boolean;
  bounds: [west: number, south: number, east: number, north: number];
  minZoom: number;
  maxZoom: number;
  expectedResourceCount: number;
  completedResourceCount: number;
  bytesDownloaded: number;
  status: OfflinePackStatus;
  createdAt: number;
  updatedAt: number;
  lastVerifiedAt?: number;
};
```

The manifest is a **filesystem truth record**, not the game state blob. The existing `RunQuestState` retains the user-visible region metadata and remains forward-migrated. A new format can be added with an optional field and a default of `xyz-directory-v1`; old records without the field continue to use the legacy directory resolver.

The first implementation should use a staging directory such as `packs/{regionId}.partial/`. Downloads write there, and a final atomic rename to `packs/{regionId}/` occurs only after verification. A failed or cancelled operation leaves a resumable partial manifest or is cleaned up explicitly; it never presents half-downloaded content as READY.

## Organic Maps-inspired management experience

### Region discovery

The map-management screen opens with a calm list of **Downloaded regions** and an action to **Choose an area**. Choosing an area uses the current map viewport as the proposed bounds rather than requiring a latitude/longitude form. A compact preview card shows the region name, approximate coverage, selected provider, zoom range, estimated size, and whether offline use is permitted.

### Region detail sheet

The detail sheet should answer four questions without technical jargon: **What area is this? Which map source will be used? How much space will it require? Will it be available without internet?** The primary action is “Download region” or “Update region.” Secondary actions are “Set active,” “Pause,” “Retry,” and “Delete.” Attribution and the source’s license link remain visible in the sheet and on the map.

### State presentation

| Pack state | Primary UI | Allowed actions |
|---|---|---|
| Not installed | Size estimate and provider policy | Download, change bounds, cancel |
| Downloading | Determinate progress, bytes, completed/expected resources, current rate if reliable | Pause, cancel |
| Paused | Preserved progress and “resume” explanation | Resume, cancel |
| Verifying | Non-dismissable short status | Wait, background the screen safely |
| Ready | Green/teal offline-ready indicator and last verified time | Set active, update, delete |
| Stale | Last-known offline map remains usable with update warning | Update, keep, delete |
| Corrupt | Clear explanation and repair choice | Repair, delete |
| Failed | Human-readable error category | Retry, change provider, delete partial |

### Storage guardrails

The UI should show total offline usage, available free space, and the maximum number of packs. Before a download, the app estimates size and refuses an operation that would cross the configured storage budget. Deletion requires a confirmation that names the region and space to be recovered. “Delete all” is a separate destructive action and must not be adjacent to the normal pack row action.

### Offline confidence

When the device is offline, the map should display the active pack name and “Offline map ready” only when the pack is READY and the selected provider/style is compatible with that pack. If no pack covers the current viewport, the app should say “No downloaded map for this area” rather than implying that the entire map is offline. The game ledger and expedition mechanics remain local-first regardless of map coverage.

## Migration and verification plan

### Existing packs

Existing `OfflineMapRegion` records must continue to load. The migration should infer `format: "xyz-directory-v1"` only when the current directory layout and provider metadata match the legacy implementation. It must never silently re-label a pack as PMTiles, vector, or a different tile provider.

### Provider snapshots

Every installed pack must snapshot its provider identity, URL template, attribution, license, style identifier, and offline-permission decision at install time. Changing the global tile-server setting must not make an old pack ambiguous. A pack can become STALE when its provider changes or its source is no longer permitted, but the app should not delete it automatically.

### Integrity

The minimum verification sequence is: confirm the manifest version, validate bounds and zoom values, check expected resource count, check every expected resource exists, check resource size is non-zero, and confirm the final directory/manifest rename. A future large archive may add a file-level SHA-256 or archive checksum, but the first milestone should not load an entire archive into memory to calculate a hash.

### Update strategy

For a directory pack, update means revalidate and download only missing or changed resources into a new staging directory. The current READY directory remains usable until the replacement is fully verified. For MBTiles/PMTiles/vector archives, update means download a replacement archive, verify it, then swap the file pointer atomically; in-place mutation is not assumed.

## Staged recommendation

| Stage | Deliverable | Archive decision | Approval gate |
|---|---|---|---|
| 0 | Provider/policy model and archive adapter interface | No new archive; freeze legacy compatibility | Confirm permitted provider(s) and attribution requirements |
| 1 | Organic Maps-style region manager | `xyz-directory-v1` with staging directory and manifest | Approve UI and migration tests |
| 2 | Larger permitted regions and better update/repair | Still directory packs or MapLibre `OfflineManager` if the selected style/provider is compatible | Confirm device storage and tile-count budgets |
| 3 | Archive proof-of-concept | PMTiles or MBTiles on API 24/current Android builds | Require native rendering, RAM, cancellation, and update evidence |
| 4 | Strategic vector/offline source | Provider-supplied/self-hosted vector archive or PMTiles | Require licensing, style, attribution, and rollback plan |

MapLibre’s own `OfflineManager` deserves a focused proof-of-concept during Stage 2. It already exposes asynchronous pack creation, progress/error callbacks, invalidation, deletion, pack enumeration, listener management, and a configurable progress-event throttle.[2] If it supports the chosen provider style and offline source without violating the Google-free and policy constraints, it could replace some custom tile-file orchestration. It should not be adopted blindly for the current public OSM raster URL: the OSMF policy prohibits prefetch/offline use of that service.[4]

## Final recommendation

Select **provider-aware XYZ directory packs with a versioned manifest** for the first Organic Maps-inspired region-management release. It provides the safest path to refresh/delete/select UI, resumable downloads, corruption recovery, and legacy compatibility while keeping the memory profile predictable on Android 7 devices.

Evaluate **MapLibre OfflineManager** as the first integration alternative because it is already part of the installed MapLibre ecosystem. Evaluate **PMTiles or MBTiles** only for larger, provider-supplied or self-hosted archives after proving local native rendering. Prefer PMTiles for immutable, distribution-oriented vector regions and MBTiles for transactional on-device database access; neither should replace the first directory-pack milestone without evidence.

The public OpenStreetMap raster endpoint cannot be the offline source. The app must use a provider that explicitly permits offline/prefetch use or a self-hosted source, retain visible attribution, identify itself correctly, and preserve the selected provider within each pack.[4]

## References

[1]: https://github.com/organicmaps/organicmaps "Organic Maps — privacy-first offline maps UX reference"
[2]: https://maplibre.org/maplibre-react-native/docs/modules/offline-manager/ "MapLibre React Native — OfflineManager"
[3]: https://docs.protomaps.com/pmtiles/ "Protomaps — PMTiles concepts and comparisons"
[4]: https://operations.osmfoundation.org/policies/tiles/ "OpenStreetMap Foundation — Tile Usage Policy"
[5]: https://github.com/mapbox/mbtiles-spec "Mapbox — MBTiles specification"
[6]: https://github.com/maplibre/maplibre-react-native "MapLibre React Native repository"

## Review questions before implementation

1. Should RunQuest’s first supported offline provider be a self-hosted source, a specific provider that explicitly permits offline use, or only a user-supplied custom source?
2. Should the first release remain bounded to the existing four-pack limit and 3×3 region size, or should the management UI expose a larger bounded viewport immediately?
3. Should PMTiles be treated as a future import-only format, or should it receive a native proof-of-concept before the directory-pack manager is implemented?
4. Should “Set active” select one map pack globally, or should Expedition and Atlas allow separate active selections?

This document is a design deliverable only. No implementation should begin until these decisions and the staged roadmap are explicitly approved.

