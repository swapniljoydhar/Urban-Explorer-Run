# Android Compatibility and Performance Baseline

## Test environment

RunQuest’s Android build path was checked with Expo SDK 54 diagnostics and a production Android Hermes export. The sandbox does **not** include `adb`, an Android emulator, `sdkmanager`, `avdmanager`, or an `ANDROID_HOME` configuration. Therefore, this environment cannot truthfully report emulator frame timing, Android PSS/RSS, battery drain, or physical-GPS behavior.

| Check | Result |
|---|---|
| Expo SDK diagnostic | **18/18 checks passed** after dependency and config alignment. |
| TypeScript | Passed. |
| Deterministic regression suite | **13 RunQuest tests passed**. |
| Lint | Passed. |
| Android Hermes export | Passed. |
| Native emulator / `adb` test | Blocked by unavailable Android SDK and AVD tooling in the sandbox. |

## Android bundle measurement

| Measurement | Before optimization | After optimization | Change |
|---|---:|---:|---:|
| Android Hermes JavaScript bundle | 5,480,288 bytes | 4,917,727 bytes | **−562,561 bytes (−10.26%)** |
| Total Android export directory | 5.8 MB | 5.2 MB | Reduced |

The initial pruning of unused media dependencies did not materially change Hermes output because unused JavaScript was already excluded by bundling. The measured reduction came from removing the unused OAuth callback route and cloud-query/web-container providers from the native root tree. This keeps the local-first product from shipping template authentication paths it does not use.

## Resource safeguards retained

| Area | Guardrail |
|---|---|
| Active route memory | At most **250** location samples are held in an active expedition route. |
| Saved history | At most **200** completed workouts are retained locally. |
| Achievement ledger | At most **50** permanent unlock records are retained. |
| Atlas rendering | Map overlays render only the recent visible set rather than an unbounded global list. |
| Tracking writes | Local state writes are batched during active tracking and retried after temporary storage failures. |
| GPS integrity | Invalid, low-confidence, out-of-order, and implausibly fast samples cannot inflate route progress or rewards. |

## Required physical Android follow-up

Before release, use a physical device or configured emulator at Android API 24, 29, and 36. Record cold-start time, memory PSS using Android Studio Memory Profiler, foreground-tracking battery use, permission-denial behavior, long-expedition route growth, and map rendering with poor connectivity. The test matrix in `docs/compatibility.md` remains the release gate.
