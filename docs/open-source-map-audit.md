# Google-Free Map Stack Audit

RunQuest previously used `react-native-maps` on Android. Its default Android map implementation depends on Google Maps, so it does not meet the project’s Google-free requirement even when local tile overlays are used.

The selected native replacement is **MapLibre React Native**, an MIT-licensed React Native wrapper for MapLibre Native on Android and iOS. The current project already meets its documented baseline of React Native 0.80+, Android API 23+, and the new architecture. MapLibre supports raster tile sources with explicit tile URL templates and a native offline manager for bounded pack creation, progress, deletion, and cache limits.

| Decision | RunQuest approach |
|---|---|
| Native renderer | Replace `react-native-maps` with `@maplibre/maplibre-react-native`. |
| Foreground location | Replace `expo-location` with MapLibre LocationManager and configure MapLibre’s `default` Android engine, which its plugin documents as F-Droid compatible. |
| Online base map | Use OpenStreetMap-derived raster tiles via a project-controlled style URL, retaining visible attribution. |
| Offline map packs | Use MapLibre OfflineManager packs for future build-native downloads. Preserve legacy RunQuest offline-region metadata and migrate it to the new pack records without erasing user data. |
| Offline boundary | Cap native map packs and their tile count. Do not silently request unavailable network resources when a saved pack is active. |
| Web preview | Retain the existing Leaflet/OpenStreetMap implementation because it is already open source and does not use Google Maps. |
| Build consequence | MapLibre requires a rebuilt custom native app; it cannot run in Expo Go. |

## Verified application-layer result

The Android project generated from this Expo configuration contains no `com.google.android.gms`, `play-services`, Firebase, or Google Maps dependency declarations. `react-native-maps` and `expo-location` were removed. MapLibre’s own source retains an **optional** Google location-engine branch, but the generated Gradle configuration sets `org.maplibre.reactnative.locationEngine=default`; that branch is not selected in the RunQuest application build.

This claim applies to the **RunQuest application layer**. The app cannot remove Google components that a user or manufacturer has installed in Android firmware, the Play Store, or another app. It neither requires nor bundles those services.

## Sources

1. [MapLibre React Native repository](https://github.com/maplibre/maplibre-react-native) — MIT license and MapLibre Native Android/iOS wrapper.
2. [MapLibre React Native Getting Started](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/) — current Android/API/new-architecture requirements and custom map style requirement.
3. [MapLibre RasterSource](https://maplibre.org/maplibre-react-native/docs/components/sources/raster-source/) — raster tile URL template and attribution support.
4. [MapLibre OfflineManager](https://maplibre.org/maplibre-react-native/docs/modules/offline-manager/) — offline pack creation, progress, deletion, and tile-count limit APIs.
5. [react-native-maps tile documentation](https://github.com/react-native-maps/react-native-maps/blob/master/docs/tiles.md) — confirms cached/offline tile handling is client-managed and identifies the Android map dependency being replaced.
6. [MapLibre Expo Setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/) — requires the MapLibre Expo config plugin and a rebuilt custom native app; it is not available in Expo Go.
