# RunQuest Attached Brief Reconciliation

**Status:** Read-only product and architecture reconciliation. The current provider checkpoint remains intact; this document does not import unrelated native code or change the application architecture.

## Executive conclusion

The attached brief describes the same broad product ambition as RunQuest: a privacy-first, Google-free, local-first exploration and fitness game that combines movement tracking, map discovery, progression, offline access, sensor-assisted measurement, strong visual design, and a compatibility promise.

The current workspace implements that vision as an **Expo SDK 54 / React Native app**, not as the native Kotlin/JNI music-and-fitness application described in several sections of the attachment. RunQuest has no `NativeAudioModule`, BPM decoder, H3 codec, `LocationService`, WorkManager worker, Kotlin `DataStoreModule`, Retrofit repository, Hilt graph, or Gradle test project. Those instructions are therefore reference material for engineering principles only; importing them would create a second architecture, increase bundle and maintenance cost, and conflict with the current Google-free/local-first design.

The correct next phase is not to blindly “fix every line” from the attachment. It is to preserve the working RunQuest architecture, close the gaps that actually exist in this workspace, and validate every change through TypeScript, Vitest, Expo lint, Android export/build metadata, and physical-device testing where native sensors are involved.

## Product alignment

| Attached vision | Current RunQuest implementation | Assessment |
|---|---|---|
| Urban exploration as a game | Hex-grid discovery, XP/levels, Field Contracts, achievements, expedition reports, and a persistent Atlas | Strong foundation; the next differentiator is richer route intent and spatial feedback rather than more generic tracker metrics. |
| Local-first privacy | AsyncStorage state, local workout history, local tiles, no account or cloud sync | Aligned. Persistence still needs atomic/journaled recovery for stronger corruption resistance. |
| Google-free maps | MapLibre Native, OSM-derived sources, no Google Maps/Firebase/Play Services location in the app layer | Aligned. The current OpenFreeMap style configuration is online-capable; new public-tile prefetch is correctly guarded until a permitted offline archive source exists. |
| Offline navigation | Legacy bounded local packs remain readable and removable | Partially complete. The provider-aware archive and full region-management lifecycle remain unfinished. |
| High performance | Bounded route history, capped tile rendering, 30 FPS map target, debounced persistence, deterministic tests, reduced bundle | Good baseline. Needs profiling on physical Android devices and cleanup of template/server residue. |
| Sensor-assisted tracking | Foreground MapLibre location and Pedometer | Partially complete. Accelerometer, barometer, gyroscope, magnetometer, light, and motion-classification layers are not yet implemented. |
| Immersive product quality | Dark atlas visual language, progress animations, haptics, achievement feedback, map overlays | Good foundation. Theme variants, responsive layouts, richer map motion, and contextual feedback remain opportunities. |

## Native-app residue versus applicable RunQuest work

### Instructions that do not apply

The following attachment items refer to a different native application and should not be implemented in RunQuest unless a future audit finds an actual equivalent module:

| Attachment item | Why it does not apply |
|---|---|
| `NativeAudioModule`, BPM decoding, `MediaExtractor`, `MediaCodec`, raw float arrays, onset detection | RunQuest is not a music-analysis app and has no audio-analysis bridge. |
| `DataStoreModule`, `SetRpgState`, `getRpgState`, native workout CRUD | RunQuest already owns persistence in a single React Context and AsyncStorage migration boundary. |
| H3 resolution 10, `TileKeyCodec.kt`, H3 fallback migration | RunQuest uses the stable `rq:hex-grid-v1:q:r` identity contract, already persisted and tested. Replacing it with H3 would break saved identities and violate the compatibility promise. |
| `TileDownloadWorker`, WorkManager retry queue, Kotlin `LocationService` | RunQuest intentionally has no background location or native WorkManager service. Its current model is foreground-only and Expo/MapLibre-based. |
| Hilt, Retrofit, Coil/Glide, Gradle assemble/test commands | These are native Android stack recommendations. RunQuest’s source-of-truth gates are `pnpm check`, `pnpm test`, `pnpm lint`, Expo export/build metadata, and device validation. |
| `ACCESS_BACKGROUND_LOCATION` removal | The current app already does not implement background location. The relevant requirement is to preserve the foreground-only boundary. |

### Instructions that do apply

The engineering principles behind the attachment are applicable: avoid transferring huge raw arrays across a bridge, keep long-lived work cancellable, make downloads resumable, validate permissions at runtime, preserve stable identifiers, separate sensor collection from domain logic, avoid high-rate listeners by default, and test persistence and lifecycle failures rather than only happy paths.

## Current gap matrix

| Area | Current state | Required next work | Priority |
|---|---|---|---|
| MapLibre marker | Static GeoJSON current-position circle | Native animated marker, accuracy ring, reduced-motion path, camera follow/recenter state machine | High |
| Provider settings | OpenFreeMap Liberty URL and HTTPS validation are persisted and exposed in Settings | Add provider diagnostics, source health, style-schema failure messaging, and source snapshots in packs | High |
| Offline archive | Existing legacy pack directories load; new public-tile prefetch is blocked | Integrate a permitted self-hosted/supplied archive or MapLibre OfflineManager proof-of-concept; add staging, verification, refresh, delete, and active-pack selection | High |
| Persistence | Versioned Zod migration and debounced retrying save | Add atomic replacement or journal/backup strategy and recovery tests | High |
| Sensor fusion | Pedometer plus MapLibre foreground location | Add capability-gated sensor providers; begin with accelerometer fallback and barometer elevation, not all sensors simultaneously | Medium |
| Sensor battery policy | Tracking modes tune location displacement | Add sampling profiles, listener cleanup, batching where supported, and an observable sensor budget | Medium |
| Route generation | Deterministic demo points and GPS route recording | Define randomized bounded route missions with a deterministic seed, route constraints, and no false XP from simulated movement | Medium |
| UX/themes | Strong dark atlas theme and reduced-motion setting | Add responsive layout tests, semantic theme tokens, high-contrast state checks, and clearer offline/provider status | Medium |
| Cleanup | Several template/server/auth/dependency residues remain tracked | Remove only after import-graph confirmation, lockfile update, export checks, and rollback checkpoint | Medium |
| Validation | 17 deterministic tests pass; lint and type checks pass | Add provider, archive lifecycle, marker state, sensor capability, and persistence-recovery tests; run Android export and device tests | High |

## Sensor strategy that fits RunQuest

The attachment is correct that sensor fusion should be layered, but “use every available sensor” is not a safe default. Sensor presence differs by device, sampling costs differ, and many readings are redundant or unreliable when the phone is in a pocket. RunQuest should use a capability-driven pipeline:

| Layer | Initial role | Default policy |
|---|---|---|
| Location | Route position and distance source of truth | Foreground only; existing plausibility guards remain authoritative. |
| Pedometer | Primary step count when available | Low-power subscription during a live expedition. |
| Accelerometer | Step fallback, movement confidence, stationary detection | Sample only in precision mode or when Pedometer is unavailable; use bounded windows and cleanup. |
| Barometer | Relative elevation gain/loss | Optional expedition metric, smoothed and never used to alter tile identity. |
| Gyroscope/magnetometer | Heading and movement context | On-demand for map orientation or motion classification; not continuously active by default. |
| Light/proximity | Contextual UI only | Optional indoor/outdoor or pocket hints; never a core fitness truth. |

A complementary filter or Kalman filter should not be introduced merely because it sounds industry-grade. First establish deterministic sensor adapters, calibration bounds, missing-sensor behavior, sampling budgets, and fixture-based tests. Only then should a filter be selected against recorded data.

## Performance and corruption safeguards

The current bundle and state limits are appropriate starting guardrails. The highest-value remaining reliability improvement is persistence recovery: write a temporary state, flush it, atomically replace the main record, and retain a bounded previous snapshot. Migration must still accept the current v1 shape and must never rewrite tile IDs.

Offline downloads need the same transactional discipline. A partial pack must live in a staging directory and be invisible to map rendering until its manifest, expected resource count, provider snapshot, attribution, and integrity checks pass. Updates should build a replacement pack while the current READY pack remains usable.

High-frequency sensor and map events must never cause unbounded React state churn. Sensor adapters should publish throttled domain events, route points remain capped, map layers should receive stable GeoJSON references when data is unchanged, and animation timers/subscriptions must be cancelled on pause, finish, and unmount.

## Product end goal

The credible end goal is a **privacy-first urban exploration RPG** that feels like a game rather than a passive pedometer: every expedition has a reason to move, every new area becomes persistent cartography, the map remains useful offline, progression rewards exploration without manipulating the user, and the app explains its limitations honestly on older Android devices.

The product should rival established fitness and outdoor apps through coherence rather than feature accumulation. Its defensible identity is the combination of local ownership, Google-free mapping, deterministic game state, meaningful spatial discovery, and respectful battery/permission behavior.

## Scope decision required

The current provider checkpoint integrated OpenFreeMap Liberty configuration and safely blocked new public-tile prefetch. The next implementation should not begin sensor fusion, randomized route missions, cleanup, or a new offline archive simultaneously. The recommended order is:

1. Complete MapLibre animated marker and accuracy work.
2. Select and integrate a specifically permitted self-hosted or supplied offline archive source, then build the region-management lifecycle.
3. Harden persistence recovery and add archive/provider migration tests.
4. Add accelerometer fallback and barometer elevation as separately testable sensor adapters.
5. Add randomized route missions, visual theme variants, and template cleanup only after the preceding quality gates pass.

This sequence keeps the stable hex-grid identity, current foreground-only location model, and existing saved data intact.
