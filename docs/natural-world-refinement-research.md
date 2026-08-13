# Natural-World Refinement Research Notes

**Purpose.** These notes preserve the public-source findings used to guide RunQuest’s next refinement milestone. They are design inputs, not imported code or product claims.

Organic Maps demonstrates a compatible product posture: detailed OpenStreetMap-based outdoor context, offline-first use, low-friction region handling, dark-mode readability, and privacy without analytics or accounts. RunQuest should borrow those interaction principles rather than its native implementation. [1]

OpenTracks demonstrates a compatible local-first fitness posture: permission restraint, transparent activity recording, durable exports, and optional sensor-aware metrics. RunQuest should retain its foreground-only boundary and only surface sensor signals when the device supports them. [2]

Evidence on activity gamification supports short, attainable goals and fair comparisons, but warns against unequal competitive pressure. RunQuest’s nature-oriented loops should therefore favour personal baselines, gentle Field Contracts, and restorative discovery moments over global leaderboards. [3]

| Adopt now | Defer | Exclude |
|---|---|---|
| Local daylight/seasonal ambience, personal expedition milestones, map-led discovery, quiet completion feedback, accessible reduced motion | Barometric elevation and accelerometer fallback after device validation, archive rendering proof-of-concept, route planning | Google services, public-tile bulk downloads, background tracking, ads, forced accounts, cloud competition/leaderboards |

## References

[1]: https://organicmaps.app/ "Organic Maps: Offline Hike, Bike, Trails and Navigation"
[2]: https://github.com/OpenTracksApp/OpenTracks "OpenTracks: privacy-respecting sport tracking"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5627651/ "How Gamification Affects Physical Activity: Large-scale Analysis of Walking Challenges in a Mobile Application"
