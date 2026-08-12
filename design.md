# RunQuest Mobile Interface Design

## Product direction

RunQuest is an Android-first, offline-capable exploration fitness game. It turns a run or walk into an expedition: the user selects an objective, tracks movement, reveals a personal map, gains experience for distance and new territory, and finishes with a calm, useful expedition report. The interface prioritizes one-handed portrait use, outdoor legibility, safe in-motion interaction, and graceful fallback when location, sensors, storage, or connectivity are limited.

The visual language takes the clarity and restraint of first-party mobile interfaces as its baseline. It uses familiar bottom navigation, large tap targets, clear hierarchy, predictable sheets, and subtle feedback rather than noisy game effects. All nonessential motion must be optional and must not block tracking or navigation.

## Screen list and primary content

| Screen | Primary content | Primary functionality |
|---|---|---|
| Expedition Home | Current level, daily objective, recent distance, nearby unexplored zone, prominent Start Expedition action | Starts a local simulated or live-capability-aware expedition and opens objective details |
| Active Expedition | Map-style exploration field, active route line, distance, duration, XP, new tiles, pause/end controls | Shows the live expedition state, allows pause/end, and provides restrained discovery feedback |
| Expedition Summary | Route shape, distance, new territory, XP, level progress, next objective | Saves the completed local session and guides the next action |
| Atlas | Grid/map representation of discovered tiles, coverage percentage, Cartography Mastery stages | Lets the user inspect their persistent territory and select a nearby exploration goal |
| Progression | Level, XP curve, titles, badges, Cartography Mastery explanation | Explains what progress means without hiding rules behind a large inventory system |
| History | Virtualized list of completed expeditions with distance, date, XP, and discovery count | Opens individual expedition summaries and enables safe future export hooks |
| Settings and Compatibility | Tracking mode, haptic preference, offline status, capability cards, privacy notes | Shows available, limited, unavailable, or permission-blocked device capabilities |
| Onboarding Sheet | Value proposition, local-first privacy note, compatibility promise, optional feature explanations | Introduces the app without forcing cloud accounts or unnecessary permissions |

## Key user flows

### Start an expedition

The user opens Expedition Home and taps **Start Expedition** within the lower thumb zone. The app checks its local capability model. If precise location is available, the Active Expedition screen begins in the best supported mode. If it is unavailable or blocked, the app offers a transparent local demo expedition so the game remains explorable and the user understands the fallback. The UI never claims live tracking when it is using a demo or reduced-confidence path.

### Discover territory

During an active expedition, movement samples update the domain state at a controlled cadence. New tiles cause a short pulse on the map field, one concise XP label, and optional light haptic feedback. Existing tiles update the route and distance without repetitive animation. The active screen presents only the most relevant metric and keeps pause/end actions large and visually distinct.

### Finish and continue

The user taps **End Expedition**, confirms in a short sheet, and sees a summary. The completed workout, tile ledger, XP event, and route snapshot are written locally before the success state is shown. The summary then offers a single next objective based on unexplored nearby tiles or personal atlas progress.

### Inspect compatibility

The user opens Settings and Compatibility to see a plain-language card for each capability: location, motion sensors, background-friendly tracking, offline cache, haptics, and audio. Each card uses one of four states: Available, Limited, Unavailable, or Blocked by User. This avoids hidden failures and makes older-device behavior understandable.

## Layout rules

The app is designed for 9:16 portrait screens. The primary action is anchored in the lower half of the display, while persistent navigation remains at the bottom. Active tracking avoids dense controls: the map occupies the top two-thirds, live metrics appear in a compact floating card, and pause/end actions sit within thumb reach. Screens use 16–20 px horizontal spacing, 12–16 px card spacing, and a minimum 44 px control height.

Important text uses a large, high-contrast hierarchy suitable for outdoor use. The active screen uses a dark map field with bright but sparing accents; noncritical labels remain muted. Text is never placed solely over busy map content without a solid or translucent backing plate.

## Color choices

| Token | Color | Use |
|---|---|---|
| Midnight | `#09141B` | Main dark background and map field |
| Deep Slate | `#12252F` | Raised panels and tab surfaces |
| Atlas Teal | `#32D6B0` | Primary actions, current exploration, success |
| Signal Cyan | `#53C7FF` | Routes, supporting map information, focus states |
| Sun Gold | `#FFD166` | XP, discoveries, positive achievements |
| Coral Alert | `#FF6B6B` | End expedition, warnings, reduced-confidence location |
| Cloud | `#EAF4F4` | Primary text on dark surfaces |
| Mist | `#9DB2B8` | Secondary labels and disabled states |

The palette avoids the generic neon-green gaming look. Atlas Teal identifies the player’s personal map while Signal Cyan makes route data distinct. Sun Gold is reserved for rewards so the discovery moment remains meaningful.

## Performance and compatibility decisions

The UI consumes a small, normalized expedition projection rather than raw sensor events. Map cells are represented by lightweight data and rendered only for the currently visible atlas region. The history screen uses a virtualized list. Animations use short opacity, color, and scale changes, with a static alternative for devices or users that reduce motion.

The core app does not require sign-in, cloud sync, native audio analysis, rich sensors, background tracking, or network access. Those are optional capabilities whose availability is surfaced in Settings. The durable local data model must remain versioned so a future feature cannot invalidate older workouts, tiles, or progression.
