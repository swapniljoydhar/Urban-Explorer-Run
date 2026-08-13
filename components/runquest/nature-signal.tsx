import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { rq } from "@/components/runquest/primitives";
import type { NatureMoment } from "@/lib/runquest/nature";

export function NatureSignal({ moment, compact = false }: { moment: NatureMoment; compact?: boolean }) {
  return <View accessibilityLabel={`${moment.title}. ${moment.cue}`} style={[styles.root, compact && styles.compact, { borderColor: moment.accent + "55", backgroundColor: moment.accent + "10" }]}>
    <View style={[styles.icon, { backgroundColor: moment.accent + "24", borderColor: moment.accent + "55" }]}><MaterialIcons name={moment.icon} size={compact ? 17 : 20} color={moment.accent} /></View>
    <View style={styles.copy}><Text style={[styles.label, { color: moment.accent }]}>{moment.shortLabel} / LOCAL DAYLIGHT</Text><Text style={styles.title}>{moment.title}</Text>{compact ? null : <Text style={styles.body}>{moment.cue}</Text>}</View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", gap: 11, alignItems: "flex-start", borderWidth: 1, borderRadius: 18, padding: 13 },
  compact: { borderRadius: 15, padding: 10, gap: 9 },
  icon: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  label: { fontSize: 9, letterSpacing: 0.9, fontWeight: "900" },
  title: { color: rq.cloud, fontSize: 14, lineHeight: 19, fontWeight: "900" },
  body: { color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "600", marginTop: 1 },
});
