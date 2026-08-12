import { StyleSheet, Text, View } from "react-native";

import { LoadingState, Panel, rq } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { calculateLevel, levelProgress } from "@/lib/runquest/engine";
import { useRunQuest } from "@/lib/runquest/context";
import { formatContractProgress, getContractProgress, getDailyContract, isContractClaimed } from "@/lib/runquest/contracts";

export default function ProgressScreen() {
  const { hydrated, state } = useRunQuest();
  if (!hydrated) return <LoadingState />;
  const progress = levelProgress(state.profile.totalXp);
  const level = calculateLevel(state.profile.totalXp);
  const contract = getDailyContract();
  const contractProgress = getContractProgress(state, contract);
  const contractClaimed = isContractClaimed(state, contract);
  return (
    <ScreenContainer className="px-5" safeAreaClassName="bg-background">
      <View style={styles.root}>
        <Text style={styles.eyebrow}>PROGRESSION / RULESET V1</Text>
        <Text style={styles.title}>A game with visible rules.</Text>
        <Panel style={styles.hero}>
          <Text style={styles.level}>LEVEL {level}</Text>
          <Text style={styles.rank}>{state.profile.title}</Text>
          <Text style={styles.xp}>{state.profile.totalXp.toLocaleString()} XP</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(5, progress.progress * 100)}%` }]} /></View>
          <Text style={styles.caption}>{Math.max(0, progress.nextFloor - state.profile.totalXp)} XP until level {level + 1}</Text>
        </Panel>
        <Panel style={styles.rulePanel}>
          <Text style={styles.ruleTitle}>How XP works</Text>
          <View style={styles.ruleRow}><Text style={styles.ruleAmount}>120 XP</Text><Text style={styles.ruleText}>for every kilometer recorded in an expedition</Text></View>
          <View style={styles.ruleRow}><Text style={styles.ruleAmount}>50 XP</Text><Text style={styles.ruleText}>for a newly discovered atlas cell</Text></View>
          <Text style={styles.ruleFoot}>Rules are versioned so future balance updates cannot silently rewrite saved achievements.</Text>
        </Panel>
        <Panel style={styles.contractPanel}>
          <Text style={styles.contractEyebrow}>TODAY’S FIELD CONTRACT</Text>
          <Text style={styles.contractTitle}>{contract.title}</Text>
          <Text style={styles.contractBody}>{contract.instruction}</Text>
          <View style={styles.contractTrack}><View style={[styles.contractFill, { width: `${Math.max(5, Math.min(100, contractProgress / contract.target * 100))}%` }]} /></View>
          <View style={styles.contractFooter}><Text style={styles.contractProgress}>{formatContractProgress(contract, contractProgress)}</Text><Text style={styles.contractReward}>{contractClaimed ? "Reward secured" : `+${contract.rewardXp} XP`}</Text></View>
        </Panel>
        <Panel style={styles.rankPanel}>
          <Text style={styles.rankEyebrow}>TITLE LADDER</Text>
          <Text style={styles.rankBody}>Street Surveyor at 250 XP · Atlas Pathfinder at 800 XP · Terrain Cartographer at 1,800 XP · Wayfinder Prime at 4,000 XP.</Text>
        </Panel>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 18, gap: 16 },
  eyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 1.25, fontWeight: "800" },
  title: { color: rq.cloud, fontSize: 28, lineHeight: 34, letterSpacing: -0.7, fontWeight: "800" },
  hero: { gap: 8, paddingTop: 24, paddingBottom: 22 },
  level: { color: rq.gold, textAlign: "center", fontSize: 12, letterSpacing: 1.4, fontWeight: "900" },
  rank: { color: rq.cloud, textAlign: "center", fontSize: 24, lineHeight: 30, fontWeight: "800" },
  xp: { color: rq.mist, textAlign: "center", fontSize: 14, fontWeight: "700" },
  track: { height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: rq.midnight, marginTop: 12 },
  fill: { height: "100%", borderRadius: 5, backgroundColor: rq.gold },
  caption: { color: rq.mist, textAlign: "center", fontSize: 12, fontWeight: "600", marginTop: 3 },
  rulePanel: { gap: 14 },
  ruleTitle: { color: rq.cloud, fontSize: 16, fontWeight: "800" },
  ruleRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  ruleAmount: { color: rq.teal, minWidth: 58, fontSize: 13, fontWeight: "900" },
  ruleText: { color: rq.mist, flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  ruleFoot: { color: rq.mist, fontSize: 12, lineHeight: 18, fontWeight: "500", borderTopColor: rq.border, borderTopWidth: 1, paddingTop: 13 },
  contractPanel: { gap: 8, backgroundColor: rq.cyan + "10", borderColor: rq.cyan + "45" },
  contractEyebrow: { color: rq.cyan, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  contractTitle: { color: rq.cloud, fontSize: 17, fontWeight: "900" },
  contractBody: { color: rq.mist, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  contractTrack: { height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: rq.midnight },
  contractFill: { height: "100%", borderRadius: 4, backgroundColor: rq.teal },
  contractFooter: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  contractProgress: { color: rq.cloud, fontSize: 12, fontWeight: "800" },
  contractReward: { color: rq.gold, fontSize: 12, fontWeight: "900" },
  rankPanel: { gap: 6 },
  rankEyebrow: { color: rq.gold, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  rankBody: { color: rq.mist, fontSize: 12, lineHeight: 18, fontWeight: "600" },
});
