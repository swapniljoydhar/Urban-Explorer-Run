# RunQuest

RunQuest is an Android-first, local-first exploration fitness game. A run or walk becomes an expedition: users record a foreground session, reveal persistent atlas cells, earn progression, and keep their history on the device. The repository is a clean rebuild based on recovered product descriptions, not a reconstruction of a lost codebase.

## What is implemented

| Area | Current behavior |
|---|---|
| Expedition loop | A user can start an expedition, pause or resume it, finish it, and save a local summary. |
| Foreground tracking | Foreground location is requested only when a quest starts. If unavailable, the app uses a clearly labeled local demo expedition. |
| Cartography | A deterministic, versioned hex-grid identity records discovery, revisit mapping, and mastery. |
| Progression | Distance and newly discovered cells earn versioned XP. The level curve is deterministic. |
| Persistence | Local state is stored with a schema version and safe defaults for future migrations. |
| Compatibility | Device capabilities are categorized as Available, Limited, Unavailable, or Blocked by User. |
| Performance | Route history is bounded in memory, history uses `FlatList`, and no server, account, cloud sync, or background worker is required for the core loop. |

## Compatibility promise

RunQuest is designed with **Windows-style compatibility discipline**, within a clear Android support boundary. The app supports Android API 24 and later. It does not promise support for Android releases below the declared minimum, because current Expo and React Native tooling cannot reasonably maintain that promise.

Within the supported range, releases must preserve these contracts:

| Contract | Rule |
|---|---|
| Local data | Existing workouts, XP, settings, and tile records must migrate forward rather than be discarded. |
| Tile identity | A saved `rq:hex-grid-v1` tile keeps its identity forever. A future tile system must translate old IDs rather than reinterpret them silently. |
| Progression | A saved workout retains its rule-set version. Rebalancing must not rewrite prior earned XP without an explicit migration. |
| Capability fallback | New features must describe an unavailable state and retain the core local expedition loop on lower-capability devices. |
| Permissions | Permissions are requested when a feature is used, not at application launch. Declining a capability must not produce a dead end. |
| Performance | Raw route history is bounded while an expedition is active. Long lists remain virtualized. |

See [docs/compatibility.md](docs/compatibility.md) for the implementation and release rules.

## Architecture

```text
app/                         Expo Router screens
components/runquest/         Reusable game UI primitives and atlas visualization
lib/runquest/types.ts        Versioned domain contracts
lib/runquest/engine.ts       Pure XP, level, tile, and sample-processing rules
lib/runquest/migration.ts    Forward-safe local state migration
lib/runquest/persistence.ts  AsyncStorage boundary
lib/runquest/capabilities.ts Device capability inspection and fallback states
lib/runquest/context.tsx     Single state and tracking owner
tests/                       Deterministic regression tests
```

The initial build deliberately uses foreground tracking only. Background location is technically and policy-sensitive, varies by device vendor, and should be introduced later only with a dedicated permission explanation, foreground-service design, integration tests, and a user-visible fallback.

## Local development

| Command | Purpose |
|---|---|
| `pnpm dev` | Starts the local API process and Expo development server. |
| `pnpm android` | Opens the Android development flow. |
| `pnpm check` | Runs TypeScript validation. |
| `pnpm test` | Runs all deterministic tests. |
| `pnpm lint` | Runs the Expo lint configuration. |

## GitHub preservation workflow

Create a **private** GitHub repository, then run the following in the project folder. Do not commit secrets, signing keys, personal location histories, `.env` files, or Android keystores.

```bash
git init
git add .
git commit -m "feat: rebuild RunQuest local-first exploration core"
gh repo create RunQuest --private --source=. --remote=origin --push
```

Every future change should use a small branch, run `pnpm check`, `pnpm test`, and `pnpm lint`, then be merged only after the compatibility contracts are reviewed. The included GitHub workflow performs these checks on every pull request.

## Deliberate next steps

The first production expansion should be **offline map downloads**, followed by optional background expedition tracking. Do not add sign-in, cloud sync, social feeds, real-time multiplayer, or data-heavy live tiles until the local core has been tested on a range of Android API levels and lower-memory devices.
