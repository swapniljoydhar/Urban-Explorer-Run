# RunQuest Experience and Resilience Audit

## Assessment

The first rebuilt version established a trustworthy foundation, but its loop is overly transactional: start, collect generic XP, end, and view a log. It does not create anticipation before an outing, a strategic decision during it, or a satisfying debrief afterward. The atlas is persistent but underused; it needs meaningful objectives, progress states, and a visible reward cadence.

| Area | Observed gap | Improvement selected |
|---|---|---|
| Motivation | The home objective is static and does not respond to player behavior. | Add deterministic daily **Field Contracts** for distance, discoveries, and completed expeditions. |
| Completion | Finishing an expedition routes directly to history. | Add a dedicated expedition report with earned XP, contract progress, and the next field instruction. |
| Atlas strategy | Repeated map samples can increase a tile’s visit count without the player meaningfully returning. | Count at most one tile visit per expedition, so mapping and mastery represent separate outings. |
| GPS integrity | The engine rejects very large segments but does not reject invalid coordinates, non-monotonic timestamps, or implausible speed. | Add input validation and a maximum movement-speed guard before rewards or route updates. |
| Persistence | Migration merges unvalidated stored JSON into live state. | Validate persisted shapes and numeric bounds before migration; retain safe defaults for malformed values. |
| Resource use | Every new tile can trigger a full local-state write during tracking. | Batch local state persistence briefly and flush it at the end of an expedition. |
| Recovery | A storage write failure is silent. | Expose a local save-state indicator and preserve in-memory progress until the next successful write. |

## Open-source evaluation

| Foundation | Assessment | Decision |
|---|---|---|
| [react-native-maps](https://github.com/react-native-maps/react-native-maps) | Mature MIT-licensed native map component with a large community; already adopted for Android/iOS map rendering. | Retain for native map display and overlays. |
| [h3-js](https://github.com/uber/h3-js) | Mature Apache-2.0 global hex-index system. | Defer adoption. Existing `hex-grid-v1` IDs must remain stable; a future H3 upgrade requires explicit translation, not replacement. |
| [Zod](https://github.com/colinhacks/zod) | Mature MIT-licensed TypeScript schema validation library; already available in the dependency tree. | Adopt at the AsyncStorage boundary to harden restored state. |

The verified Skill catalog search did not return a relevant ready-made mobile-game performance skill, so this iteration uses the project’s existing mobile guidance and audited, established libraries rather than importing an unverified dependency.
