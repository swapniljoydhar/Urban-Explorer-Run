import { StyleSheet, Text, View } from "react-native";

import { GeographicMap } from "@/components/runquest/geographic-map";
import { LoadingState, Metric, Panel, rq } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { useRunQuest } from "@/lib/runquest/context";

export default function AtlasScreen() {
  const { hydrated, state } = useRunQuest();
  if (!hydrated) return <LoadingState />;
  const tiles = Object.values(state.tiles);
  const mastered = tiles.filter((tile) => tile.mastery === "MASTERED").length;
  const mapped = tiles.filter((tile) => tile.mastery === "MAPPED").length;
  return (
    <ScreenContainer className="px-5" safeAreaClassName="bg-background">
      <View style={styles.root}>
        <Text style={styles.eyebrow}>PERSONAL CARTOGRAPHY</Text>
        <Text style={styles.title}>Your atlas remembers.</Text>
        <Text style={styles.body}>Every discovered cell is local, versioned, and ready for future map upgrades without changing its meaning.</Text>
        <View style={styles.mapWrap}><GeographicMap tiles={tiles} route={state.workouts[0]?.route ?? []} currentPoint={state.workouts[0]?.route.at(-1) ?? null} /></View>
        <Panel style={styles.panel}>
          <View style={styles.row}><Metric label="Discovered" value={String(tiles.length)} accent={rq.teal} /><Metric label="Mapped" value={String(mapped)} accent={rq.cyan} /><Metric label="Mastered" value={String(mastered)} accent={rq.gold} /></View>
        </Panel>
        <Panel style={styles.note}><Text style={styles.noteTitle}>Cartography Mastery</Text><Text style={styles.noteBody}>A second visit maps a cell. A third visit masters it. Later versions can add new goals without rewriting the cells you already earned.</Text></Panel>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 18, gap: 16 },
  eyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 1.3, fontWeight: "800" },
  title: { color: rq.cloud, fontSize: 28, lineHeight: 34, letterSpacing: -0.7, fontWeight: "800" },
  body: { color: rq.mist, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  mapWrap: { height: 285, overflow: "hidden", borderRadius: 22, borderWidth: 1, borderColor: rq.border, backgroundColor: rq.midnight },
  panel: { paddingVertical: 16 },
  row: { flexDirection: "row", gap: 10 },
  note: { gap: 7 },
  noteTitle: { color: rq.gold, fontSize: 14, fontWeight: "800" },
  noteBody: { color: rq.mist, fontSize: 13, lineHeight: 19, fontWeight: "500" },
});
