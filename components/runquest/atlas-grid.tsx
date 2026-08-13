import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Polygon, Polyline } from "react-native-svg";

import { rq } from "@/components/runquest/primitives";

type GridCell = { key: string; points: string; fill: string; opacity: number };

function hexPoints(centerX: number, centerY: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
  }).join(" ");
}

export function AtlasGrid({ discovered, active = false, routePoints = 0 }: { discovered: number; active?: boolean; routePoints?: number }) {
  const cells = useMemo<GridCell[]>(() => {
    return Array.from({ length: 30 }, (_, index) => {
      const column = index % 6;
      const row = Math.floor(index / 6);
      const x = 32 + column * 52 + (row % 2 ? 26 : 0);
      const y = 30 + row * 40;
      const isKnown = index < discovered;
      const isActive = active && index === Math.min(discovered, 29);
      return {
        key: `cell-${index}`,
        points: hexPoints(x, y, 25),
        fill: isActive ? rq.gold : isKnown ? "#4E8F61" : rq.panel,
        opacity: isKnown ? 0.9 : 0.7,
      };
    });
  }, [active, discovered]);

  const route = routePoints > 1 ? "34,192 67,160 104,166 132,126 170,136 204,91 244,96 286,48" : "";
  return (
    <View style={styles.wrap} accessibilityLabel={`${discovered} discovered atlas cells`}>
      <Svg width="100%" height={224} viewBox="0 0 350 224">
        {cells.map((cell) => <Polygon key={cell.key} points={cell.points} fill={cell.fill} opacity={cell.opacity} stroke={rq.border} strokeWidth={1.2} />)}
        {route ? <Polyline points={route} fill="none" stroke={rq.cyan} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} /> : null}
      </Svg>
      <View style={styles.caption}>
        <View style={[styles.legendDot, { backgroundColor: rq.teal }]} />
        <Text style={styles.captionText}>{discovered ? "Ground remembered locally" : "A field atlas waiting to grow"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", borderRadius: 22, backgroundColor: rq.midnight, borderWidth: 1, borderColor: rq.border },
  caption: { position: "absolute", left: 14, bottom: 14, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: rq.midnight + "E8", flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  captionText: { color: rq.cloud, fontSize: 11, fontWeight: "700" },
});
