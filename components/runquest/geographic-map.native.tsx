import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Camera, GeoJSONSource, Layer, Map, RasterSource } from "@maplibre/maplibre-react-native";

import type { GeographicMapProps } from "@/components/runquest/geographic-map.types";
import { rq } from "@/components/runquest/primitives";
import { offlineTileUrlTemplate } from "@/lib/runquest/offline-packages";
import { OPENFREEMAP_ATTRIBUTION, OPENFREEMAP_STYLE_URL } from "@/lib/runquest/map-providers";

const DEFAULT_CENTER: [number, number] = [-122.4194, 37.7749];
const LEGACY_OPEN_STREET_MAP_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const BASE_STYLE = {
  version: 8 as const,
  name: "RunQuest Open Atlas",
  sources: {},
  layers: [{ id: "runquest-background", type: "background" as const, paint: { "background-color": rq.midnight } }],
};

export function GeographicMap({ route, tiles, currentPoint, offlineRegion, mapStyleUrl = OPENFREEMAP_STYLE_URL }: GeographicMapProps) {
  const initialPoint = route[0] ?? currentPoint;
  const initialCenter: [number, number] = initialPoint ? [initialPoint.longitude, initialPoint.latitude] : DEFAULT_CENTER;
  const mapKey = initialPoint ? `map-${initialPoint.timestamp}` : "map-fallback";
  const atlasTiles = useMemo(() => tiles.filter((tile) => tile.latitude !== undefined && tile.longitude !== undefined).slice(-80), [tiles]);
  const tileTemplate = offlineRegion ? offlineTileUrlTemplate(offlineRegion) ?? LEGACY_OPEN_STREET_MAP_TILES : null;
  const atlasFeatures = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: atlasTiles.map((tile) => ({ type: "Feature", properties: { mastery: tile.mastery }, geometry: { type: "Point", coordinates: [tile.longitude as number, tile.latitude as number] } })),
  }), [atlasTiles]);
  const routeFeature = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: route.length > 1 ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route.map((point) => [point.longitude, point.latitude]) } }] : [],
  }), [route]);
  const currentFeature = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: currentPoint ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [currentPoint.longitude, currentPoint.latitude] } }] : [],
  }), [currentPoint]);

  return (
    <View style={styles.root}>
      <Map
        key={mapKey}
        style={styles.map}
        mapStyle={offlineRegion ? BASE_STYLE : mapStyleUrl}
        preferredFramesPerSecond={30}
        touchRotate={false}
        touchPitch={false}
        attribution
        attributionPosition={{ bottom: 8, right: 8 }}
        logo
        logoPosition={{ bottom: 8, left: 8 }}
        compass
        accessibilityLabel="Interactive geographic expedition map"
      >
        <Camera initialViewState={{ center: initialCenter, zoom: 15 }} />
        {offlineRegion && tileTemplate ? <RasterSource id={`atlas-tiles-${offlineRegion.id}`} tiles={[tileTemplate]} minzoom={0} maxzoom={18} tileSize={256} scheme="xyz" attribution={offlineRegion.provider === "OpenFreeMap" ? OPENFREEMAP_ATTRIBUTION : "© OpenStreetMap contributors"}>
          <Layer id="atlas-raster" type="raster" paint={{ "raster-opacity": 1 }} />
        </RasterSource> : null}
        <GeoJSONSource id="runquest-atlas-cells" data={atlasFeatures} tolerance={1}>
          <Layer id="runquest-atlas-cells-layer" type="circle" paint={{ "circle-radius": 11, "circle-color": ["match", ["get", "mastery"], "MASTERED", rq.gold, rq.teal], "circle-opacity": 0.3, "circle-stroke-color": ["match", ["get", "mastery"], "MASTERED", rq.gold, rq.teal], "circle-stroke-width": 1.5 }} />
        </GeoJSONSource>
        <GeoJSONSource id="runquest-route" data={routeFeature} tolerance={2}>
          <Layer id="runquest-route-layer" type="line" layout={{ "line-cap": "round", "line-join": "round" }} paint={{ "line-color": rq.cyan, "line-width": 5 }} />
        </GeoJSONSource>
        <GeoJSONSource id="runquest-current-position" data={currentFeature}>
          <Layer id="runquest-current-position-layer" type="circle" paint={{ "circle-radius": 8, "circle-color": rq.coral, "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 2 }} />
        </GeoJSONSource>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: rq.midnight },
  map: { flex: 1 },
});
