# RunQuest Security and Reliability Audit

**Audit date:** 13 August 2026  
**Scope:** The local-first mobile client, saved-state persistence, local archive handling, server template boundaries, runtime configuration, and production dependency graph.

## Verified fixes

| Area | Verified finding | Remediation |
|---|---|---|
| Credentialed cross-origin requests | The server reflected every request `Origin` while enabling credentials. | CORS now permits only explicit `CORS_ALLOWED_ORIGINS` values, the same API origin, local development origins, or the paired `8081-*` preview host for a `3000-*` API host. Unknown origins receive no credentialed CORS response. |
| Session cookies | Cookies were shared across every sibling subdomain and used `SameSite=None`. | Session cookies are now host-only, `HttpOnly`, `Secure` on HTTPS, and `SameSite=Lax`. |
| Server input limits | JSON and URL-encoded payloads allowed 50 MB. | Both limits are now 1 MB, which is ample for the existing control and auth routes while reducing memory-exhaustion exposure. |
| Server configuration | Production could attempt session signing with an empty or undersized secret. | Production startup now fails if `JWT_SECRET` is below 32 characters; any request that needs signing also rejects an undersized secret. |
| Storage redirect proxy | The legacy wildcard route was incompatible with Express 5 and accepted unbounded keys. | The proxy uses Express 5 named wildcard syntax, bounds keys to 1,024 characters, rejects empty/traversal segments, and redirects only to valid HTTPS signed URLs. |
| Local archive records | A corrupted persisted archive URI could be used for removal, inspection, or export outside RunQuest’s managed archive directory. | Archive actions now require a one-file path under the app-managed `runquest-archives/` directory. |
| Local persistence | A malformed or interrupted primary AsyncStorage snapshot caused a reset to defaults. | RunQuest now writes a validated recovery snapshot before the primary snapshot and falls back to it when the primary value cannot be decoded. |
| Direct dependencies | Several direct dependencies were behind current security releases. | Updated Axios to 1.19.0, Drizzle ORM to 0.45.2, Express to 5.2.1, Express types to 5.0.6, and the synchronized tRPC packages to 11.18.0. |

## Validation

The audit remediation passed `pnpm check`, `pnpm test`, `pnpm lint`, Android export, web export, and a mobile Home-screen preview. The deterministic suite now contains **30 passing RunQuest tests** plus one intentionally skipped template-auth test. New coverage verifies CORS origin decisions, host-only session cookie options, managed archive paths, and malformed-primary persistence recovery.

## Dependency-audit outcome

`pnpm audit --prod --json` reports **zero critical advisories** after remediation. It continues to report high-severity records in transitive Expo, Metro, React Native, and build-tool dependencies. These are mostly supplied by the SDK toolchain rather than imported by RunQuest feature code; examples include Metro image parsing and Expo CLI networking helpers. They must be resolved through a compatible Expo/React Native SDK update, rather than by forcing unsupported transitive upgrades that could invalidate Android 7 or MapLibre compatibility. The project retains its lockfile and has no dependency override that pretends these advisories are fixed.

## Ongoing safeguards

RunQuest remains local-first, single-player, Google-free, Android 7 compatible, and backward compatible with existing saved game data. The persistence backup is a recovery fallback rather than a full database transaction log; a future journaling migration can strengthen crash consistency without changing the existing `RunQuestState` contract.

## References

[1]: https://pnpm.io/settings "pnpm workspace settings and dependency overrides"
[2]: https://expressjs.com/en/guide/migrating-5.html "Express 5 migration guidance"
[3]: https://docs.expo.dev/versions/latest/ "Expo SDK documentation"
