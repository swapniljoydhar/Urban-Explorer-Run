import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { rq } from "@/components/runquest/primitives";

export function ContractProgress({
  progress,
  target,
  label,
  reduceMotion,
  claimed = false,
  compact = false,
}: {
  progress: number;
  target: number;
  label: string;
  reduceMotion: boolean;
  claimed?: boolean;
  compact?: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, target > 0 ? progress / target : 0));
  const width = useRef(new Animated.Value(ratio)).current;
  const previousRatio = useRef(ratio);
  const [expanded, setExpanded] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const complete = ratio >= 1;

  useEffect(() => {
    if (reduceMotion) {
      width.setValue(ratio);
    } else {
      Animated.timing(width, { toValue: ratio, duration: 260, useNativeDriver: false }).start();
    }
    if (!reduceMotion && previousRatio.current < 1 && ratio >= 1) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 1_500);
      previousRatio.current = ratio;
      return () => clearTimeout(timer);
    }
    previousRatio.current = ratio;
  }, [ratio, reduceMotion, width]);

  const fillWidth = width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const status = claimed ? "REWARD SECURED" : complete ? "READY TO SECURE" : "IN PROGRESS";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Field Contract progress: ${label}. ${status}. Tap for progress details.`}
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((value) => !value)}
      style={[styles.root, compact && styles.compact]}
    >
      <View style={styles.topLine}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.status, (complete || claimed) && styles.statusComplete, celebrating && styles.statusCelebrating]}><MaterialIcons name={claimed ? "verified" : complete ? "check-circle" : "radar"} size={13} color={(complete || claimed) ? rq.midnight : rq.cyan} /><Text style={[styles.statusText, (complete || claimed) && styles.statusTextComplete]}>{status}</Text></View>
      </View>
      <View style={styles.track}><Animated.View style={[styles.fill, { width: fillWidth }, (complete || claimed) && styles.fillComplete]} /></View>
      {expanded ? <Text style={styles.detail}>{claimed ? "This daily reward is written to your local expedition ledger." : complete ? "Finish the expedition to secure this contract reward in your local ledger." : "Live progress updates during the expedition. Reduced-motion mode replaces the glide with an instant update."}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  compact: { gap: 6 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { flex: 1, color: rq.cloud, fontSize: 11, fontWeight: "800" },
  status: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: rq.cyan + "18" },
  statusComplete: { backgroundColor: rq.gold },
  statusCelebrating: { transform: [{ scale: 1.04 }] },
  statusText: { color: rq.cyan, fontSize: 9, letterSpacing: 0.55, fontWeight: "900" },
  statusTextComplete: { color: rq.midnight },
  track: { height: 8, overflow: "hidden", borderRadius: 4, backgroundColor: rq.midnight },
  fill: { height: "100%", borderRadius: 4, backgroundColor: rq.teal },
  fillComplete: { backgroundColor: rq.gold },
  detail: { color: rq.mist, fontSize: 11, lineHeight: 16, fontWeight: "600" },
});
