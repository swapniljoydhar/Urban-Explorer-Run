import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import type { RoutePoint } from "@/lib/runquest/types";
import { getMarkerAccuracyBand, getMarkerColor } from "@/lib/runquest/map-marker";

export function CurrentLocationMarker({ point, reduceMotion }: { point: RoutePoint; reduceMotion: boolean }) {
  const pulse = useSharedValue(0);
  const band = getMarkerAccuracyBand(point.accuracy);
  const color = getMarkerColor(band);

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = reduceMotion ? 0 : withRepeat(withTiming(1, { duration: 1_400 }), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.28 : 0.16 + pulse.value * 0.18,
    transform: [{ scale: reduceMotion ? 1 : 1 + pulse.value * 0.55 }],
  }), [reduceMotion]);

  return (
    <Marker id="runquest-current-location" lngLat={[point.longitude, point.latitude]} anchor="center">
      <View style={styles.marker} accessible accessibilityLabel={`Current location, ${band} GPS accuracy`}>
        <Animated.View style={[styles.pulse, { borderColor: color }, pulseStyle]} />
        <View style={[styles.halo, { borderColor: color }]} />
        <View style={[styles.core, { backgroundColor: color }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  pulse: { position: "absolute", width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
  halo: { position: "absolute", width: 22, height: 22, borderRadius: 11, borderWidth: 2, backgroundColor: "#07131BCC" },
  core: { width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: "#FFFFFF" },
});
