# RunQuest Compatibility Charter

## Purpose

RunQuest uses a compatibility contract similar in spirit to mature desktop platforms: improving the app should not cause a user’s saved game, supported device, or basic workflow to fail unexpectedly. This is an engineering rule, not a claim that every Android release can run the current toolchain.

The initial support range is **Android API 24 and later**. This is encoded in `app.config.ts`. Any proposal to raise that minimum must be treated as a product decision, documented in release notes, and reviewed before implementation.

## Stable data boundaries

| Boundary | Stable identifier | Migration rule |
|---|---|---|
| Local state | `RunQuestState.version` | Increment the state version only with a pure forward migration and regression fixtures from the prior version. |
| Tiles | `rq:hex-grid-v1:<q>:<r>` | Never change the meaning of an existing ID. Introduce a new encoder and translate old records if a new map system is needed. |
| Workouts | `WorkoutRecord.id` | Preserve IDs and timestamps. Add fields as optional defaults before making them required. |
| Progression | `rulesetVersion` | Store the rule set used to grant rewards. Never rebalance historical rewards silently. |
| Settings | Named keys with default fallback | New settings must have a safe default when absent from legacy state. |

## Capability contract

Every hardware or platform-dependent feature must expose one state:

| State | Required user experience |
|---|---|
| Available | The feature works and can be activated normally. |
| Limited | The core experience still works, but a specific quality or convenience is reduced. |
| Unavailable | The app explains why and provides a path that does not claim the feature is running. |
| Blocked by User | The app explains the permission choice and keeps the demo or local alternative usable. |

The core expedition flow must always have a local demo fallback. It may not label simulated discovery as live GPS tracking.

## Non-breaking release checklist

Before a release, complete the following checks.

| Check | Acceptance condition |
|---|---|
| State fixture migration | A fixture from the prior state version loads without loss of profile, tiles, workouts, or settings. |
| Replay safety | Repeating a location sample cannot produce duplicate first-discovery XP. |
| Permission denial | Denying foreground location reaches demo expedition, not an error screen. |
| Low confidence GPS | Weak accuracy does not award map territory. |
| Long session bound | In-memory active route samples remain bounded. |
| Lower capability device | Missing step sensor, haptics, or location services produces an explicit capability card. |
| New behavior | Any new Android API call is protected behind capability checking and has a fallback. |

## Performance budget principles

The active screen consumes derived metrics, not an ever-growing raw sensor stream. The application retains at most 250 live route samples in memory. The persisted workout route is intentionally also bounded in this initial build. A later full-route export system should stream route chunks to file storage or a local database rather than keep an unbounded JavaScript array.

Atlas rendering is data-light: only normalized tile state is retained. History uses a virtualized list. Visual feedback should remain short, optional, and paired with a static alternative.

## Forbidden shortcuts

Do not change `minSdkVersion`, replace the tile encoder, change the migration default values, add background location, or introduce a second persistence engine as a quick fix. Each could break saved state, create duplicate tracking owners, or change behavior on older phones.
