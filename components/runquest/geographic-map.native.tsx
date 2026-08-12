import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Camera, GeoJSONSource, Layer, Map, RasterSource, type CameraRef } from "@maplibre/maplibre-react-native";

import { CurrentLocationMarker } from "@/components/runquest/current-location-marker.native";
import type { GeographicMapProps } from "@/components/runquest/geographic-map.types";
import { rq } from "@/components/runquest/primitives";
import { offlineTileUrlTemplate } from "@/lib/runquest/offline-packages";
import { createAccuracyFeature, canFollowCamera, getMarkerAccuracyBand, getMarkerColor, shouldInterruptFollow, type MarkerFollowMode } from "@/lib/runquest/map-marker";
import { OPENFREEMAP_ATTRIBUTION, OPENFREEMAP_STYLE_URL } from "@/lib/runquest/map-providers";

const DEFAULT_CENTER: [number, number] = [-122.4194, 37.7749];
const LEGACY_OPEN_STREET_MAP_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const BASE_STYLE = {
  version: 8 as const,
  name: "RunQuest Open Atlas",
  sources: {},
  layers: [{ id: "runquest-background", type: "background" as const, paint: { "background-color": rq.midnight } }],
};

export function GeographicMap({ route, tiles, currentPoint, offlineRegion, mapStyleUrl = OPENFREEMAP_STYLE_URL, reduceMotion = false }: GeographicMapProps) {
  const initialPoint = route[0] ?? currentPoint;
  const initialCenter: [number, number] = initialPoint ? [initialPoint.longitude, initialPoint.latitude] : DEFAULT_CENTER;
  const mapKey = initialPoint ? `map-${initialPoint.timestamp}` : "map-fallback";
  const cameraRef = useRef<CameraRef>(null);
  const lastCameraUpdate = useRef(0);
  const [followMode, setFollowMode] = useState<MarkerFollowMode>(currentPoint ? "following" : "free");
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
  const accuracyFeature = useMemo(() => createAccuracyFeature(currentPoint), [currentPoint]);

  const followCurrentPoint = useCallback((duration: number) => {
    if (!currentPoint || !canFollowCamera(followMode, true)) return;
    const now = Date.now();
    if (now - lastCameraUpdate.current < 650) return;
    lastCameraUpdate.current = now;
    cameraRef.current?.easeTo({ center: [currentPoint.longitude, currentPoint.latitude], duration });
  }, [currentPoint, followMode]);

  useEffect(() => {
    followCurrentPoint(reduceMotion ? 0 : 300);
  }, [currentPoint?.timestamp, followCurrentPoint, reduceMotion]);

  const recenter = useCallback(() => {
    if (!currentPoint) return;
    setFollowMode("following");
    lastCameraUpdate.current = Date.now();
    cameraRef.current?.easeTo({ center: [currentPoint.longitude, currentPoint.latitude], duration: reduceMotion ? 0 : 350 });
  }, [currentPoint, reduceMotion]);

  const accuracyBand = getMarkerAccuracyBand(currentPoint?.accuracy);
  const accuracyColor = getMarkerColor(accuracyBand);

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
        onRegionDidChange={(event) => {
          if (shouldInterruptFollow(event.nativeEvent.userInteraction, followMode)) setFollowMode("free");
        }}
        accessibilityLabel="Interactive geographic expedition map"
      >
        <Camera ref={cameraRef} initialViewState={{ center: initialCenter, zoom: 15 }} />
        {offlineRegion && tileTemplate ? <RasterSource id={`atlas-tiles-${offlineRegion.id}`} tiles={[tileTemplate]} minzoom={0} maxzoom={18} tileSize={256} scheme="xyz" attribution={offlineRegion.provider === "OpenFreeMap" ? OPENFREEMAP_ATTRIBUTION : "© OpenStreetMap contributors"}>
          <Layer id="atlas-raster" type="raster" paint={{ "raster-opacity": 1 }} />
        </RasterSource> : null}
        <GeoJSONSource id="runquest-atlas-cells" data={atlasFeatures} tolerance={1}>
          <Layer id="runquest-atlas-cells-layer" type="circle" paint={{ "circle-radius": 11, "circle-color": ["match", ["get", "mastery"], "MASTERED", rq.gold, rq.teal], "circle-opacity": 0.3, "circle-stroke-color": ["match", ["get", "mastery"], "MASTERED", rq.gold, rq.teal], "circle-stroke-width": 1.5 }} />
        </GeoJSONSource>
        <GeoJSONSource id="runquest-route" data={routeFeature} tolerance={2}>
          <Layer id="runquest-route-layer" type="line" layout={{ "line-cap": "round", "line-join": "round" }} paint={{ "line-color": rq.cyan, "line-width": 5 }} />
        </GeoJSONSource>
        {accuracyFeature ? <GeoJSONSource id="runquest-location-accuracy" data={{ type: "FeatureCollection", features: [accuracyFeature] }}>
          <Layer id="runquest-location-accuracy-fill" type="fill" paint={{ "fill-color": accuracyColor, "fill-opacity": 0.11 }} />
          <Layer id="runquest-location-accuracy-line" type="line" paint={{ "line-color": accuracyColor, "line-opacity": 0.7, "line-width": 1.5 }} />
        </GeoJSONSource> : null}
        {currentPoint ? <CurrentLocationMarker point={currentPoint} reduceMotion={reduceMotion} /> : null}
      </Map>
      {currentPoint ? <Pressable onPress={recenter} accessibilityRole="button" accessibilityLabel={followMode === "following" ? "Following current location" : "Recenter on current location"} style={({ pressed }) => [styles.recenter, pressed && styles.pressed]}>
        <Text style={[styles.recenterDot, { color: accuracyColor }]}>◎</Text>
        <Text style={styles.recenterText}>{followMode === "following" ? "Following" : "Recenter"}</Text>
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: rq.midnight },
  map: { flex: 1 },
  recenter: { position: "absolute", right: 14, bottom: 14, flexDirection: "row", alignItems: "center", gap: 6, minHeight: 38, paddingHorizontal: 12, borderRadius: 19, backgroundColor: rq.deepSlate + "F2", borderWidth: 1, borderColor: rq.border },
  recenterDot: { fontSize: 20, lineHeight: 20, fontWeight: "800" },
  recenterText: { color: rq.cloud, fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
