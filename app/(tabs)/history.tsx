import { FlatList, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { LoadingState, Panel, rq, StatePill } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { formatDate, formatDistance } from "@/lib/runquest/format";
import { useRunQuest } from "@/lib/runquest/context";
import type { WorkoutRecord } from "@/lib/runquest/types";

export default function HistoryScreen() {
  const { hydrated, state } = useRunQuest();
  if (!hydrated) return <LoadingState />;
  const renderItem = ({ item }: { item: WorkoutRecord }) => (
    <Panel style={styles.card}>
      <View style={styles.cardTop}><View><Text style={styles.date}>{formatDate(item.startedAt)}</Text><Text style={styles.mode}>{item.mode === "live" ? "Foreground expedition" : "Local demo expedition"}</Text></View><StatePill state={item.mode === "live" ? "AVAILABLE" : "LIMITED"} label={item.mode.toUpperCase()} /></View>
      <View style={styles.stats}><Text style={styles.distance}>{formatDistance(item.distanceMeters)}</Text><Text style={styles.xp}>+{item.xpEarned} XP</Text></View>
      <View style={styles.meta}><MaterialIcons name="grid-view" size={15} color={rq.teal} /><Text style={styles.metaText}>{item.newTileCount} new atlas cells · {item.steps > 0 ? `${item.steps} steps` : "distance-led tracking"}</Text></View>
    </Panel>
  );
  return (
    <ScreenContainer className="px-5" safeAreaClassName="bg-background">
      <FlatList
        data={state.workouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={state.workouts.length ? styles.list : styles.emptyList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.header}><Text style={styles.eyebrow}>LOCAL EXPEDITION LOG</Text><Text style={styles.title}>Your history stays yours.</Text><Text style={styles.body}>Each completed expedition is stored locally with a versioned rule set and route snapshot.</Text></View>}
        ListEmptyComponent={<Panel style={styles.empty}><MaterialIcons name="history" size={30} color={rq.cyan} /><Text style={styles.emptyTitle}>No expeditions saved yet.</Text><Text style={styles.emptyBody}>Start your first quest to build a local record that future updates can safely carry forward.</Text></Panel>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 18, paddingBottom: 28, gap: 12 },
  emptyList: { flexGrow: 1, paddingTop: 18, paddingBottom: 28, gap: 12 },
  header: { gap: 6, marginBottom: 8 },
  eyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 1.25, fontWeight: "800" },
  title: { color: rq.cloud, fontSize: 28, lineHeight: 34, letterSpacing: -0.7, fontWeight: "800" },
  body: { color: rq.mist, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  card: { gap: 13 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  date: { color: rq.cloud, fontSize: 15, fontWeight: "800" },
  mode: { color: rq.mist, fontSize: 12, fontWeight: "600", marginTop: 3 },
  stats: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  distance: { color: rq.teal, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  xp: { color: rq.gold, fontSize: 14, fontWeight: "900" },
  meta: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, borderTopColor: rq.border, paddingTop: 12 },
  metaText: { flex: 1, color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  empty: { alignItems: "center", gap: 10, marginTop: 12, paddingVertical: 28 },
  emptyTitle: { color: rq.cloud, fontSize: 17, fontWeight: "800" },
  emptyBody: { color: rq.mist, fontSize: 13, lineHeight: 19, textAlign: "center" },
});
