import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { GeographicMapProps } from "@/components/runquest/geographic-map.types";
import { rq } from "@/components/runquest/primitives";

type MapParts = {
  MapContainer: ComponentType<any>;
  TileLayer: ComponentType<any>;
  Circle: ComponentType<any>;
  CircleMarker: ComponentType<any>;
  Polyline: ComponentType<any>;
};

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

export function GeographicMap({ route, tiles, currentPoint }: GeographicMapProps) {
  const [parts, setParts] = useState<MapParts | null>(null);
  const initialPoint = route[0] ?? currentPoint;
  const center: [number, number] = initialPoint ? [initialPoint.latitude, initialPoint.longitude] : DEFAULT_CENTER;
  const mapKey = initialPoint ? `map-${initialPoint.timestamp}` : "map-fallback";
  const atlasTiles = useMemo(() => tiles.filter((tile) => tile.latitude !== undefined && tile.longitude !== undefined).slice(-80), [tiles]);
  const routeCoordinates = route.map((point) => [point.latitude, point.longitude] as [number, number]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;
    void import("react-leaflet").then((module) => {
      if (!mounted) return;
      setParts({
        MapContainer: module.MapContainer,
        TileLayer: module.TileLayer,
        Circle: module.Circle,
        CircleMarker: module.CircleMarker,
        Polyline: module.Polyline,
      });
    });
    return () => { mounted = false; };
  }, []);

  if (!parts) {
    return <View style={styles.loading}><Text style={styles.loadingText}>Loading geographic map…</Text></View>;
  }

  const { MapContainer, TileLayer, Circle, CircleMarker, Polyline } = parts;
  return (
    <View style={styles.root}>
      <MapContainer key={mapKey} center={center} zoom={15} scrollWheelZoom className="runquest-leaflet-map" aria-label="Interactive geographic expedition map">
        <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {atlasTiles.map((tile) => <Circle key={tile.id} center={[tile.latitude as number, tile.longitude as number]} radius={62} pathOptions={{ color: tile.mastery === "MASTERED" ? rq.gold : rq.teal, fillColor: tile.mastery === "MASTERED" ? rq.gold : rq.teal, fillOpacity: 0.28, weight: 1.5 }} />)}
        {routeCoordinates.length > 1 ? <Polyline positions={routeCoordinates} pathOptions={{ color: rq.cyan, weight: 5, lineCap: "round", lineJoin: "round" }} /> : null}
        {currentPoint ? <CircleMarker center={[currentPoint.latitude, currentPoint.longitude]} radius={8} pathOptions={{ color: "#FFFFFF", fillColor: rq.coral, fillOpacity: 1, weight: 2 }} /> : null}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: rq.midnight },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: rq.midnight },
  loadingText: { color: rq.mist, fontSize: 13, fontWeight: "700" },
});
