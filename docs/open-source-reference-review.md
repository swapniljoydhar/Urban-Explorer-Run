# Open-Source Reference Review for RunQuest

**Status:** Research and architecture decision record only. No third-party source code, dependency, asset, or application configuration was added or changed.

## Purpose

This review responds to the request to use maintained open-source projects where they genuinely improve reliability. It distinguishes **adoptable patterns** from **incompatible architectures**. RunQuest remains an Expo SDK 54, React Native, local-first Android app with a MapLibre Native renderer and a Google-free app layer.

## Sources reviewed

| Project | Maturity signal at review | Relevant strengths | RunQuest decision |
|---|---:|---|---|
| [MapLibre React Native][1] | 651 GitHub stars; active on 11 August 2026; MIT | Native Android/iOS MapLibre renderer, React Native annotations, camera APIs, style layers | **Adopt directly.** It is the installed map engine and the authoritative source for marker, camera, and map-event APIs. |
| [Organic Maps][2] | 15,068 GitHub stars; active on 12 August 2026; Apache 2.0 code with separately licensed data | Privacy-first, offline-first maps, user-controlled regional downloads, no-account product posture, dark mode | **Adopt product principles only.** Do not copy source/data or attempt to embed its C++ map engine into Expo. |
| [GPSLogger][3] | 2,584 GitHub stars; active on 11 August 2026; GPLv2 | Long-running location lifecycle, lightweight GPS logging, explicit session/state separation, file export discipline | **Adopt lifecycle/testing lessons only.** Its native Android/Google-provider and GPL codebase are not a drop-in dependency for RunQuest. |
| [PMTiles][4] | 2,986 GitHub stars; active on 12 August 2026; BSD-3 reference implementations / public-domain or CC0 specification | A single-file archive format for tiled data and static storage distribution | **Evaluate as a later offline-map format.** It is not required for the first three requested map features and requires a separate compatibility proof in the React Native wrapper. |

## Reference-backed decisions

### 1. Keep MapLibre React Native as the one map renderer

The official MapLibre React Native project is actively maintained and is already the correct engine for the app. The planned current-location experience uses its documented `Marker`, `Camera`, and map-region APIs rather than importing an additional marker or animation map library. This prevents duplicate renderers, limits native dependencies, and keeps the Android map stack Google-free.[1]

### 2. Make offline maps provider-aware before expanding downloads

Organic Maps demonstrates the value of privacy-first, local offline maps, but it is a full native map application—not a package that can be inserted into RunQuest. The compatible takeaway is product behaviour: users should understand what they have downloaded, which region is available, how large it is, and when it can be deleted or updated. RunQuest will implement that behaviour through its own MapLibre/FileSystem architecture, after replacing the current unsupported public-OSM offline-download path.

### 3. Preserve one owner for expedition lifecycle

GPSLogger illustrates why long-running location work needs an explicit active-session boundary, clear state ownership, and careful lifecycle cleanup.[3] RunQuest already has the correct high-level provider boundary. It should strengthen it with pause/unsubscribe discipline and recoverable session checkpoints—not introduce GPSLogger’s event bus, native service stack, Google-specific provider assumptions, or GPL code.

### 4. Treat PMTiles as an option, not an unverified shortcut

PMTiles is a well-supported single-file archive format designed for tiled data.[4] It is a promising route for user-provided or self-hosted offline regions because it can reduce directory/file-management overhead. However, the first delivery should not silently substitute it for the current 3×3 pack. The team must first verify MapLibre React Native support for local PMTiles sources in the targeted Android build, confirm data licensing, design cancellation/import storage, and retain the legacy-pack migration path.

## Explicit non-adoptions

| Proposal from the notes | Why it is not being adopted now |
|---|---|
| Hilt, Retrofit, Coil, Glide | These are native Kotlin/Java Android libraries. RunQuest is an Expo/React Native project and does not need a second native dependency-injection, HTTP, or image stack for the requested map work. Adding them would add integration surface rather than remove instability. |
| Native JNI audio/BPM processing | The current workspace has no `NativeAudioModule`, JNI bridge, audio-analysis feature, or music file workflow. Introducing one would be unrelated scope and memory risk. |
| H3 native fallback repair | RunQuest uses its own versioned `rq:hex-grid-v1:q:r` ID, with no H3 library/fallback. Existing tile IDs must remain immutable; no H3 migration is necessary for the MapLibre features. |
| Background-location service | The product constraint is foreground-only tracking. No background tracking or `ACCESS_BACKGROUND_LOCATION` feature will be added for marker, pack, or tile-source work. |
| Full Organic Maps embedding | It would replace, not improve, the established React Native architecture and introduce licensing, build, and maintenance complexity. |

## Verified-skill search result

The requested verified-skill catalogue was queried for “MapLibre offline mobile fitness tracking.” Its online GitHub request encountered a connector JSON error and fell back to cache; the cache contained no matching map-specific skill. No unrelated skill will be installed. Existing official MapLibre documentation and the maintained references above are the appropriate evidence base for the current scope.

## Resulting implementation guidance

The reference review **does not change the approval gate**. It confirms the following sequence:

1. Correct offline-source compliance and local recovery before expanding map downloads.
2. Implement the approved one-marker / geodesic-accuracy / explicit-follow MapLibre design using the official installed API.
3. Implement selected-pack, update, repair, delete, and attribution UX guided by privacy-first offline-map product patterns.
4. Add source settings with strict validation and immutable per-pack source snapshots.
5. Add only capability-available sensor assistance, preserving GPS as the authority for game rewards.
6. Remove unused template/server code in a separately tested cleanup milestone.

## References

[1]: https://github.com/maplibre/maplibre-react-native "MapLibre React Native"
[2]: https://github.com/organicmaps/organicmaps "Organic Maps"
[3]: https://github.com/mendhak/gpslogger "GPSLogger"
[4]: https://github.com/protomaps/PMTiles "PMTiles"


## Provider validation update: OpenFreeMap

The first provider candidate is **OpenFreeMap**, an OSM-derived, open-source vector-map host with a documented MapLibre style URL: `https://tiles.openfreemap.org/styles/liberty`.[5] Its official site states that the public instance is free, requires no registration or API key, supports self-hosting, and allows commercial usage. Attribution is required: `OpenFreeMap © OpenMapTiles Data from OpenStreetMap`; MapLibre style metadata may provide attribution automatically, but RunQuest will still keep attribution visible in its own map/settings UI.[5]

OpenFreeMap also publishes weekly full-planet Btrfs and MBTiles downloads, and its project is designed to support self-hosting.[6] This makes it a stronger first source than the public OSM raster endpoint, but the RunQuest implementation will not crawl or bulk-prefetch the public OpenFreeMap endpoint. The safe first integration is a provider preset for the documented vector style plus an explicit **offline-capable source mode** that accepts a permitted self-hosted or supplied archive. An offline pack is READY only when its local archive/source metadata says offline use is permitted; an online public style alone is not treated as an offline pack.

OpenMapTiles’ own documentation confirms that its vector-tile schema is open source under BSD + CC-BY, while the underlying OpenStreetMap data remains subject to ODbL and requires proper attribution.[7] Stadia Maps was not selected as the first offline provider because its FAQ states that hosted APIs are not offline and directs offline users to on-premises or embedded solutions.[8]

[5]: https://openfreemap.org/quick_start/ "OpenFreeMap Quick Start Guide and MapLibre Liberty style"
[6]: https://github.com/hyperknot/openfreemap "OpenFreeMap source, self-hosting, and download information"
[7]: https://openmaptiles.org/docs/generate/generate-openmaptiles/ "OpenMapTiles vector schema and licensing guidance"
[8]: https://stadiamaps.com/faqs/ "Stadia Maps FAQ: hosted API and offline limitations"
