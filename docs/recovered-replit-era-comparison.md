# Recovered Replit-Era Repository Comparison

**Scope.** This is a read-only comparison of the recovered [`Urban-Explorer-Run1`](https://github.com/swapniljoydhar/Urban-Explorer-Run1) repository at commit `3ad542a` against the current RunQuest workspace. No code, assets, dependencies, state, or configuration were imported from the recovered repository.

## What the Recovered Project Was

The recovered project is a pnpm monorepo with a Replit-oriented mobile artifact, an Express 5 API artifact, and optional PostgreSQL/Drizzle infrastructure. Its mobile implementation uses a `WorkoutContext` with three independent AsyncStorage JSON keys, dynamically generated local workout records, a route-planning screen, a full-screen active-run screen, and a basic history/profile presentation.

> **Conclusion:** it is valuable product-history evidence, but it is not a safe source tree to merge into the present app.

| Surface | Recovered implementation | Current RunQuest position | Recovery decision |
|---|---|---|---|
| Native map | `react-native-maps` with `PROVIDER_DEFAULT` | MapLibre Native with OpenFreeMap Liberty, Google-free | **Do not port** |
| Web map | Leaflet + CARTO raster tiles | Leaflet fallback plus MapLibre-first native maps | Reference-only visual pattern |
| Route generation | Public OSRM request with randomized loop waypoints | Local-first, offline-conscious exploration; no routing engine | Do not port directly |
| Web location fallback | `ipapi.co` IP geolocation | Device location or explicit demo state | **Do not port** |
| Workout persistence | Three raw AsyncStorage keys without version validation | Versioned Zod migration plus primary/backup recovery | **Do not port** |
| Activity tracking | Foreground location + Pedometer; unbounded position array | Validated, bounded 250-point route and lifecycle cleanup | Reference-only |
| Motivation design | Step goal, stride estimate, route-vibe chips, named adventures | Field Contracts, Explorer Momentum, Field Briefs, pace zones | Selective adaptation only |
| Safety UI | Straight-line “panic” return marker | Single-player navigation must not imply emergency support | Adapt only as clearly labeled return-to-start aid |

## Recoverable Product Ideas

The recovered app’s strongest contribution is not its implementation; it is its **goal-first interaction design**. A user chooses an intended outing scale, sees an estimate, and begins a session. This can improve RunQuest without adding cloud accounts, social mechanics, or a routing dependency.

| Priority | Recoverable idea | Safe RunQuest adaptation | Required guardrails |
|---|---|---|---|
| 1 | Step-goal presets and stride estimate | Add a local **Field Intent** selector for short, regular, or long outings; convert the selection into a non-binding distance target for contracts and report context | No health diagnosis, no automatic route generation, local-only preference |
| 2 | Monthly history grouping and compact activity chart | Add an optional local expedition-rhythm chart using existing workout dates and distances | Cap data at current 200-workout boundary; label data as history, not training advice |
| 3 | Route-vibe choices | Treat “quiet,” “scenic,” or “open-space” as player-selected expedition intentions and narrative prompts, not promises about actual roads or locations | No location search, POI claims, IP lookup, or background geocoding |
| 4 | Return-to-start indicator | Add a clearly labeled **Return line** showing direct distance and bearing to the recorded first accepted point | Explicitly state it is not turn-by-turn navigation or emergency assistance |
| 5 | Named adventure cards | Expand current Field Brief vocabulary with deterministic locally generated expedition titles | Preserve natural-world style and avoid copied old strings where practical |

## Elements That Must Remain Historical Reference Only

The native `react-native-maps` implementation relies on the default provider and therefore conflicts with the project’s explicit Google-free rule. The legacy web fallback performs IP geolocation through `ipapi.co`; this is both unnecessary for native use and inconsistent with RunQuest’s local-first privacy boundary. Its route generation calls a public OSRM endpoint with randomized waypoints; even with a timeout and cooldown, it needs network access, exposes route origin to a third party, has no offline routing archive, and cannot guarantee that “parks,” “coffee,” “quiet,” or “scenic” filters match real conditions.

The legacy raw AsyncStorage model also cannot meet RunQuest’s backward-compatibility standard: separate unvalidated keys, silent JSON parse failure, and unbounded route arrays raise data-loss and memory risks. The old panic control is useful as an interaction reference, but it must never be described or designed as an emergency or safety service.

## Recommended Recovery Sequence

1. **Field Intent** is the highest-value next port: a local target selector that enriches Field Contracts and post-run reports without generating routes.
2. **Return line** is next, but only after a focused UX and safety copy review; it must stay an on-map geometric aid, not navigation.
3. **History rhythm chart** is third: it can reuse the old profile screen’s visual idea while operating only on current bounded workout records.

No recovered map, routing, IP-location, raw-persistence, database, or provider code should be copied into RunQuest. The recovered repository remains in `/home/ubuntu/reference-urban-explorer-run1` for comparison only and is intentionally separate from the active RunQuest workspace.

## Evidence

The comparison was based on the recovered repository’s `artifacts/mobile/context/WorkoutContext.tsx`, `artifacts/mobile/app/(tabs)/quest.tsx`, `artifacts/mobile/app/active-run.tsx`, `artifacts/mobile/components/MapWrapper.tsx`, and `artifacts/mobile/components/MapWrapper.web.tsx`, plus the current RunQuest `package.json` and maintained local architecture.

## References

[1] [Recovered Urban-Explorer-Run1 repository](https://github.com/swapniljoydhar/Urban-Explorer-Run1)

[2] [Current Urban-Explorer-Run repository](https://github.com/swapniljoydhar/Urban-Explorer-Run)
