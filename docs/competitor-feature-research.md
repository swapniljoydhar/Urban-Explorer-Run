# RunQuest Competitor Feature Research

**Scope.** This research identifies mechanics worth adapting from leading fitness and location-based games. It intentionally excludes social graphs, public leaderboards, cloud profiles, paid-content models, background tracking, Google dependencies, and copied narrative or branded assets. RunQuest remains a private, single-player, local-first Android application.

| Source | Proven interaction loop | Local RunQuest interpretation | Scope decision |
|---|---|---|---|
| Pokémon GO Routes | A deliberate real-world path, an end-point reward, collectible curiosities, first-completion bonuses, and a multi-day completion bonus. | A player-owned Trail Thread with an end-of-run field finding, a first-thread bonus, and a private explorer streak. | Adapt the loop; do not import community routes, parties, or sharing. |
| Zombies, Run! | A mission gives the activity narrative purpose; movement earns supplies that feed a persistent place; optional chases add urgency. | Short original field briefs and debriefs, a non-violent Camp Ledger upgraded by completed expeditions, and opt-in pace moments with no forced audio. | Adapt local narrative and growth; do not use its story, audio, world, or zombie theme. |
| Strava Segments | Route portions automatically record a time; a personal record is celebrated and encourages self-comparison. | Private self-records for distance, duration, pace, discovered cells, and future player-owned Trail Threads—no public ranking. | Adapt private PRs only; no leaderboards or social comparison. |
| Nike Run Club | Guidance, flexible plans, pace/mile feedback, streak recognition, and achievement celebration help users focus on their run. | Gentle, rate-limited haptic/visual pace guidance, personal goal paths, a streak system, and accessible achievement moments. | Adapt coaching cues and plans; no branded content, live sharing, or social challenges. |

## Primary Sources

Pokémon GO describes Routes as self-created paths followed in the real world, with field discoveries, first-route rewards, a daily first-route XP bonus, and a seven-day completion bonus.[1]

Zombies, Run! describes a workout loop where movement triggers story, optional chases, and supplies that translate into base progress.[2] Its Base Builder documentation demonstrates a clear, capped resource-to-upgrade loop with unlock requirements and persistent local goals.[3]

Strava defines segments as discrete GPS route sections where each effort is timed, including private personal-record recognition independent of public leaderboards.[4] [5]

Nike Run Club emphasizes pace, location, distance, elevation, splits, Guided Runs, flexible plans, and celebrations for personal records and streaks.[6] [7]

OpenTracks is an Apache-2.0 open-source Android tracker with an active maintained project history; it is a reference for conservative, privacy-oriented workout tracking rather than a dependency for this Expo project.[8]

## First Milestone Recommendation

The first milestone should combine **Explorer Momentum** (daily streaks plus personal records) with **Field Briefs** (brief original, device-time-aware expedition narrative). It offers the highest motivational value for the least runtime, memory, and compatibility risk. It only adds small persisted records and pure engine functions, can be fully migration-safe, and provides a firm foundation for later private Trail Threads, pace coaching, weekly fieldwork, elevation gain, and optional speech/haptic cues.

## References

[1]: https://pokemongolive.com/en/routes "Pokémon GO Routes"
[2]: https://zombiesrungame.com/ "Zombies, Run!"
[3]: https://support.sixtostart.com/hc/en-us/articles/4421007214353-Base-Builder "Zombies, Run! Base Builder"
[4]: https://support.strava.com/en-us/articles/15401945-strava-segments "Strava Segments"
[5]: https://support.strava.com/en-us/articles/15402042-what-s-a-segment "What’s a Segment?"
[6]: https://www.nike.com/nrc-app "Nike Run Club"
[7]: https://www.nike.com/running/half-marathon-training-plan "Nike Run Club Half-Marathon Training Plan"
[8]: https://github.com/OpenTracksApp/OpenTracks "OpenTracks GitHub repository"
