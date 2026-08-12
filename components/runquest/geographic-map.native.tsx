import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, Polyline, type Region } from "react-native-maps";

import type { GeographicMapProps } from "@/components/runquest/geographic-map.types";
import { rq } from "@/components/runquest/primitives";

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

function toRegion(latitude: number, longitude: number): Region {
  return { latitude, longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 };
}

export function GeographicMap({ route, tiles, currentPoint }: GeographicMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const initialPoint = route[0] ?? currentPoint;
  const initialRegion = initialPoint ? toRegion(initialPoint.latitude, initialPoint.longitude) : DEFAULT_REGION;
  const mapKey = initialPoint ? `map-${initialPoint.timestamp}` : "map-fallback";
  const atlasTiles = useMemo(() => tiles.filter((tile) => tile.latitude !== undefined && tile.longitude !== undefined).slice(-80), [tiles]);

  useEffect(() => {
    if (!currentPoint || route.length > 1) return;
    mapRef.current?.animateToRegion(toRegion(currentPoint.latitude, currentPoint.longitude), 280);
  }, [currentPoint, route.length]);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        key={mapKey}
        style={styles.map}
        initialRegion={initialRegion}
        mapType="standard"
        showsCompass
        showsScale
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        accessibilityLabel="Interactive geographic expedition map"
      >
        {atlasTiles.map((tile) => (
          <Circle
            key={tile.id}
            center={{ latitude: tile.latitude as number, longitude: tile.longitude as number }}
            radius={62}
            strokeColor={tile.mastery === "MASTERED" ? rq.gold : rq.teal}
            fillColor={tile.mastery === "MASTERED" ? "#FFD16644" : "#32D6B044"}
            strokeWidth={1.5}
          />
        ))}
        {route.length > 1 ? <Polyline coordinates={route} strokeColor={rq.cyan} strokeWidth={5} lineCap="round" lineJoin="round" /> : null}
        {currentPoint ? <Marker coordinate={currentPoint} pinColor={rq.coral} title="Current position" /> : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: rq.midnight },
  map: { flex: 1 },
});
