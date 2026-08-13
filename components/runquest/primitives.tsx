import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export const rq = {
  midnight: "#081611",
  deepSlate: "#10251A",
  panel: "#173528",
  teal: "#71D6A4",
  cyan: "#79C7D5",
  gold: "#F6C768",
  coral: "#E9785D",
  cloud: "#EFF7EE",
  mist: "#A9BCA9",
  border: "#2D5742",
};

export function Panel({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  tone = "teal",
  disabled = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress: () => void;
  tone?: "teal" | "coral" | "slate";
  disabled?: boolean;
}) {
  const backgroundColor = tone === "coral" ? rq.coral : tone === "slate" ? rq.deepSlate : rq.teal;
  const labelColor = tone === "slate" ? rq.cloud : rq.midnight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, { backgroundColor, opacity: disabled ? 0.46 : pressed ? 0.84 : 1 }]}
    >
      <MaterialIcons name={icon} size={20} color={labelColor} />
      <Text style={[styles.primaryLabel, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

export function SmallButton({
  label,
  onPress,
  active = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.smallButton, active && styles.smallButtonActive, pressed && styles.pressed]}
    >
      <Text style={[styles.smallLabel, active && styles.smallLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function Metric({ label, value, accent = rq.cloud }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function StatePill({ state, label }: { state: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "BLOCKED_BY_USER"; label?: string }) {
  const color = state === "AVAILABLE" ? rq.teal : state === "LIMITED" ? rq.gold : state === "BLOCKED_BY_USER" ? rq.coral : rq.mist;
  return (
    <View style={[styles.pill, { borderColor: color + "55", backgroundColor: color + "1A" }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label ?? state.replaceAll("_", " ")}</Text>
    </View>
  );
}

export function LoadingState({ label = "Opening your local atlas…" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={rq.teal} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: rq.deepSlate, borderRadius: 24, borderWidth: 1, borderColor: rq.border, padding: 18 },
  primaryButton: { minHeight: 54, borderRadius: 18, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryLabel: { fontSize: 16, fontWeight: "800", letterSpacing: 0.1 },
  smallButton: { minHeight: 42, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: rq.border, justifyContent: "center", backgroundColor: rq.deepSlate },
  smallButtonActive: { backgroundColor: rq.teal + "20", borderColor: rq.teal },
  smallLabel: { color: rq.mist, fontSize: 13, fontWeight: "700", textAlign: "center" },
  smallLabelActive: { color: rq.teal },
  metric: { flex: 1, minWidth: 0 },
  metricValue: { fontSize: 24, lineHeight: 29, fontWeight: "800", letterSpacing: -0.4 },
  metricLabel: { color: rq.mist, fontSize: 11, lineHeight: 15, fontWeight: "700", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 },
  pill: { alignSelf: "flex-start", minHeight: 27, paddingHorizontal: 10, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.65 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: rq.midnight },
  loadingLabel: { color: rq.mist, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
});
