# Project TODO

- [x] Establish compatibility-safe Android support boundaries and capability states
- [x] Create a local-first RunQuest domain model for expeditions, tiles, XP, and progression
- [x] Add versioned persistence with safe future migration hooks
- [x] Implement the Expedition Home experience
- [x] Implement active expedition controls with transparent fallback tracking mode
- [x] Implement Cartography Mastery atlas and tile discovery feedback
- [x] Implement progression and history screens using efficient lists
- [x] Implement compatibility/settings screen with capability states
- [x] Add accessibility, reduced-motion, and low-memory UI fallbacks
- [x] Add deterministic unit tests for XP, levels, tile discovery, persistence, and fallback behavior
- [x] Generate a custom RunQuest app icon and update mobile branding configuration
- [x] Add GitHub-ready documentation, ignore rules, and project recovery instructions
- [x] Fix web-safe cleanup of active location and sensor subscriptions when an expedition ends
- [x] Replace the placeholder atlas-only active view with an interactive geographic map and local discovery overlay
- [x] Add regression tests for subscription cleanup and map fallback behavior
- [x] Restore and verify the development server after a preview interruption
- [x] Audit and strengthen the expedition loop, UX clarity, persistence boundaries, and foreseeable failure modes
- [x] Add strategic objectives, meaningful rewards, and richer post-expedition progression feedback
- [x] Add safer data validation, rate-limited event handling, and recovery guards without breaking saved state
- [x] Improve map, atlas, and history presentation for a more immersive game-quality experience
- [x] Validate the strengthened app against compatibility, performance, and regression limits
- [x] Restore and verify the development server after the repeated preview interruption
- [x] Push the completed RunQuest source tree to the Urban-Explorer-Run GitHub repository safely
- [x] Establish the available Android emulator or compatible runtime test baseline and document its limits
- [x] Measure bundle composition and memory-relevant runtime indicators, then apply evidence-based optimizations
- [x] Add a durable achievement system that complements rather than duplicates daily Field Contracts
- [x] Validate Android compatibility paths, achievement persistence, bundle output, and performance safeguards
- [x] Add reduced-motion-safe interactive Field Contract progress and completion feedback
- [x] Add bounded local offline map-region package preparation, download, removal, and state reporting
- [x] Validate offline package persistence, map fallbacks, and contract completion feedback without exceeding resource limits
- [x] Audit and remove Google-backed map, SDK, and build assumptions from the Android app
- [x] Replace native mapping with an open-source renderer and preserve offline Atlas package behavior
- [x] Validate the Google-free Android build path and document any device-level Google components outside app control
- [ ] Complete and obtain approval for a full architecture, product, quality, security, performance, UX, and cleanup assessment before further implementation
- [x] Add MapLibre animated current-location markers and accuracy indicators after plan approval
- [x] Build full downloaded offline-region management, refresh, and deletion workflows after plan approval
- [ ] Add open-source tile-server selection, validation, attribution, and server-switching settings after plan approval
- [ ] Evaluate and prioritize sensor-assisted tracking improvements, motion/visual polish, responsive themes, and accessibility enhancements after plan approval
- [ ] Reconcile the user’s newly attached quality requirements with the architecture report, including visual design, animation, responsive layout, theme variants, notification hierarchy, and accessibility, before implementation approval
- [ ] Plan a compatibility-safe cleanup of unused template code, folders, assets, dependencies, and development-server processes only after approved regression coverage and build validation are defined
- [ ] Define post-approval physical-device stress, lifecycle, data-recovery, offline-package, and performance validation for the approved changes
- [x] Produce and obtain review of the detailed MapLibre animated-marker, accuracy-indicator, and camera-follow technical design before implementing that feature
- [ ] Research maintained open-source map, offline, fitness-tracking, and React Native reference projects; reconcile only compatible patterns with the approved RunQuest roadmap before implementation
- [ ] Compare offline-map archive strategies (provider-aware raster pack, compressed archive, MBTiles, PMTiles, and vector-region packages) using Organic Maps-style UX principles; obtain approval before implementation
- [ ] Define backward-compatible archive manifest, integrity, resumable-download, stale-source, corruption-recovery, and migration rules for offline regions
- [ ] Define the Organic Maps-inspired region-management UX: discover/select region, estimate size, download/pause/resume, verify, update, set active, and delete

This strategy exploration is design-only; do not modify application code, dependencies, configuration, assets, or saved-state schema until explicit approval.
- [x] Validate the first permitted offline-capable open-source tile provider, including offline/prefetch permission, attribution, licensing, URL/style contract, and Android/MapLibre compatibility
- [x] Add a backward-compatible provider configuration model and migrate existing saved settings and offline-pack source metadata without breaking v1 state
- [x] Add a Settings panel to select, validate, preview, and manage the permitted provider configuration with visible attribution and clear offline readiness
- [ ] Thread the validated provider through MapLibre rendering and offline-pack creation while preserving legacy packs and Google-free operation
- [x] Run pnpm check, pnpm test, pnpm lint, and targeted offline-provider/Settings regression validation before checkpoint

Provider integration remains subject to evidence-based validation; no implementation should use public OSM raster tiles for offline prefetch.
- [ ] Reconcile the newly attached full project brief against the current Expo/React Native RunQuest workspace and document applicable versus unrelated native Kotlin/JNI requirements
- [ ] Produce an updated gap matrix for MapLibre markers, offline archives/provider configuration, sensor fusion, routing, persistence, performance, UX, accessibility, cleanup, and validation
- [ ] Confirm the next implementation scope with the user before making further changes beyond the current provider Settings checkpoint

The attached native-audio, H3, WorkManager, Kotlin/JNI, Retrofit, Hilt, and Gradle instructions must not be imported into RunQuest unless a current workspace audit proves an equivalent subsystem exists.
- [x] Implement the approved MapLibre animated current-location marker milestone with an accuracy ring, reduced-motion behavior, camera follow/recenter controls, and web-safe fallback
- [x] Add deterministic marker confidence, camera-follow, lifecycle, and compatibility regression tests
- [x] Validate the marker milestone with pnpm check, pnpm test, pnpm lint, Android/web export checks, and preview or device verification before checkpoint

Approval received: MapLibre marker milestone only. Do not begin offline archive, sensor fusion, cleanup, or unrelated native-app work in this milestone.
- [x] Implement approved offline-pack management: select active installed region, show source/status metadata, repair or refresh safely, and delete without affecting saved expeditions or tile identities
- [x] Add deterministic offline-pack lifecycle tests for active selection, missing/corrupt files, repair refusal, deletion, and legacy-state migration
- [x] Validate offline-pack management with pnpm check, pnpm test, pnpm lint, Android/web exports, and preview/device verification before checkpoint

Approval received: offline-pack management milestone only. Do not begin sensor fusion, archive-format migration, cleanup, or unrelated native-app work in this milestone.
- [x] Implement approved local offline-pack archive import/export with validated PMTiles/MBTiles boundaries, reversible file handling, and provider/source metadata preservation
- [x] Add document-picker and filesystem compatibility handling for Android API 24, web fallback, cancellation, corrupt/unsupported archives, and storage limits
- [x] Add deterministic archive-header/metadata validation tests and run pnpm check, pnpm test, pnpm lint, Android/web exports, and preview/device verification before checkpoint

Approval received: local archive import/export milestone only. Do not introduce public-tile prefetch, cloud sync, background services, or unrelated native-app architecture.

- [x] Establish a performance-safe natural-world visual system for terrain, weather-inspired map ambience, seasonal color language, and accessible motion
- [x] Refine the expedition loop with contextual discovery moments, restorative pacing, and nature-grounded micro-rewards without adding background tracking
- [x] Improve map and atlas environmental feedback using MapLibre layers and local game data only; no Google services or public-tile prefetch
- [ ] Audit and remove only proven-unused template residue after regression coverage confirms safe cleanup
- [x] Validate the natural-world refinement milestone with deterministic tests, Android/web exports, mobile visual verification, and memory-aware runtime checks

Program approval received: continue iterative RunQuest refinement. Each milestone must remain local-first, Google-free, Android 7 compatible, bounded in memory, accessible, and checkpointed.

- [x] Research and validate a permitted open terrain/contour source or local archive package compatible with MapLibre, OpenFreeMap, and Android 7
- [x] Add bounded single-player terrain/contour overlays with visible attribution, graceful no-data fallback, and no public-tile prefetch
- [x] Verify terrain overlay behavior in online, selected-pack, and no-data states without introducing cloud, social, leaderboard, or multiplayer features
- [x] Validate the terrain milestone with deterministic tests, Android/web exports, mobile visual review, and performance checks before checkpoint

Single-player rule confirmed: RunQuest must not add leaderboards, matchmaking, social competition, cloud profiles, or multiplayer dependencies.

- [x] Implement bounded local PMTiles terrain-header and metadata validation before any archive is classified as offline terrain data
- [x] Surface PMTiles terrain integrity status in the local archive library without unpacking archive tile payloads or adding network downloads
- [x] Add deterministic valid, invalid, truncated, unsupported, and non-terrain PMTiles header tests; validate Android/web builds before checkpoint

Approval received: PMTiles terrain-header integrity milestone only. Do not begin direct archive rendering, public-tile prefetch, cloud sync, or multiplayer work.

- [x] Add private Explorer Momentum with daily expedition streaks, longest streak, and personal best records while preserving every existing saved state
- [x] Add original local Field Brief and debrief storytelling that uses RunQuest’s natural-world vocabulary rather than copied competitor content
- [x] Surface streak, personal-record, and field-brief feedback on Home, Progress, and the post-expedition report with reduced-motion-safe visual treatment
- [x] Add deterministic migration, streak, record, and narrative tests; validate Android/web exports and mobile views before checkpoint

Competitor-inspired scope confirmed: adapt proven mechanics from location games and fitness trackers, but keep RunQuest single-player, local-first, Google-free, non-social, and Android 7 compatible.
