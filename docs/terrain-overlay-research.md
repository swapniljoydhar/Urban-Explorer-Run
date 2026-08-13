# Terrain and Contour Overlay Research

RunQuest requires a terrain treatment that is **single-player, local-first, Google-free, and policy-compliant**. The selected direction is a user-supplied local PMTiles archive or a user-managed/self-hosted TileJSON endpoint—not a bulk download from a public tile endpoint.

MapLibre Native Android supports `pmtiles://file://` sources beginning with Android 11.7.0, including `raster-dem` source types. Its documentation explicitly notes that PMTiles files should be read directly from device storage and that PMTiles sources do not use MapLibre offline-pack downloads or caching. [1]

MapLibre React Native exposes `RasterDEMSource`, with `terrarium` or `mapbox` encoding, for use with hillshade visualization. [2]

The AWS Terrain Tiles registry describes an open dataset of bare-earth elevation tiles, but Tilezen’s own service documentation says its direct S3 endpoints are intended for efficient EC2 networking rather than as a general mobile map endpoint. RunQuest will therefore preserve attribution but **will not default to or prefetch from that endpoint**. [3] [4]

| Candidate | Role in RunQuest | Decision |
|---|---|---|
| Imported Terrarium `PMTiles` | On-device hillshade source | Primary supported path after header validation and renderer proof-of-concept |
| Self-hosted Terrarium TileJSON | Optional online hillshade source | Supported only after user configuration and validation |
| OpenMapTiles / OpenMapStyles self-hosted contours | Vector contour overlay | Future optional source, attributed and self-hosted | 
| AWS Terrain Tiles public S3 bucket | Reference/open-data provenance | Not used as a default mobile tile endpoint and never bulk-prefetched |

## References

[1]: https://www.maplibre.org/maplibre-native/android/examples/data/PMTiles/ "MapLibre Native Android: PMTiles"
[2]: https://maplibre.org/maplibre-react-native/docs/components/sources/raster-dem-source/ "MapLibre React Native: RasterDEMSource"
[3]: https://registry.opendata.aws/terrain-tiles/ "AWS Open Data Registry: Terrain Tiles"
[4]: https://github.com/tilezen/joerd/blob/master/docs/use-service.md "Tilezen Joerd: Get Started with Terrain Tiles"
