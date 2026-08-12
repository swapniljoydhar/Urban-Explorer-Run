import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Metric, Panel, PrimaryButton, rq, StatePill } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance } from "@/lib/runquest/format";
import { calculateLevel } from "@/lib/runquest/engine";
import { getAchievement } from "@/lib/runquest/achievements";
import { formatContractProgress } from "@/lib/runquest/contracts";
import { useRunQuest } from "@/lib/runquest/context";

export default function ReportScreen() {
  const router = useRouter();
  const { latestReport, dismissReport } = useRunQuest();

  if (!latestReport) {
    return <ScreenContainer className="px-5 justify-center" safeAreaClassName="bg-background"><Panel style={styles.empty}><Text style={styles.emptyTitle}>No expedition report is ready.</Text><PrimaryButton label="Return to Quest" icon="arrow-back" onPress={() => router.replace("/(tabs)")} /></Panel></ScreenContainer>;
  }

  const { workout, contract, contractProgress, contractCompleted, totalXpBefore, totalXpAfter, unlockedAchievementIds } = latestReport;
  const startLevel = calculateLevel(totalXpBefore);
  const endLevel = calculateLevel(totalXpAfter);
  const finish = () => { dismissReport(); router.replace("/(tabs)"); };

  return (
    <ScreenContainer className="px-5" safeAreaClassName="bg-background">
      <View style={styles.root}>
        <View style={styles.heroIcon}><MaterialIcons name="explore" color={rq.midnight} size={30} /></View>
        <Text style={styles.eyebrow}>EXPEDITION COMPLETE</Text>
        <Text style={styles.title}>{workout.newTileCount > 0 ? "Your atlas moved outward." : "You held the line."}</Text>
        <Text style={styles.body}>Your route and rewards were committed to the local atlas. Here is what this outing changed.</Text>

        <Panel style={styles.summary}>
          <View style={styles.metricRow}><Metric label="Distance" value={formatDistance(workout.distanceMeters)} accent={rq.teal} /><Metric label="New cells" value={String(workout.newTileCount)} accent={rq.gold} /><Metric label="XP earned" value={`+${workout.xpEarned + workout.contractRewardXp}`} accent={rq.cyan} /></View>
          {endLevel > startLevel ? <View style={styles.levelUp}><MaterialIcons name="north-east" color={rq.gold} size={18} /><Text style={styles.levelUpText}>Level up: {startLevel} → {endLevel}</Text></View> : null}
        </Panel>

        <Panel style={[styles.contract, contractCompleted && styles.contractCompleted]}>
          <View style={styles.contractTop}><View><Text style={styles.contractEyebrow}>FIELD CONTRACT</Text><Text style={styles.contractTitle}>{contract.title}</Text></View><StatePill state={contractCompleted ? "AVAILABLE" : "LIMITED"} label={contractCompleted ? "CLAIMED" : "IN PROGRESS"} /></View>
          <Text style={styles.contractInstruction}>{contract.instruction}</Text>
          <View style={styles.contractTrack}><View style={[styles.contractFill, { width: `${Math.max(5, Math.min(100, contractProgress / contract.target * 100))}%` }]} /></View>
          <View style={styles.contractFooter}><Text style={styles.contractProgress}>{formatContractProgress(contract, contractProgress)}</Text><Text style={styles.contractReward}>{contractCompleted ? `+${contract.rewardXp} XP secured` : `${contract.rewardXp} XP reward`}</Text></View>
        </Panel>

        {unlockedAchievementIds.length ? <Panel style={styles.achievementPanel}>
          <Text style={styles.achievementEyebrow}>PERMANENT ACHIEVEMENT{unlockedAchievementIds.length > 1 ? "S" : ""} UNLOCKED</Text>
          {unlockedAchievementIds.map((id) => {
            const achievement = getAchievement(id);
            return <View key={id} style={styles.achievementRow}><View style={styles.achievementIcon}><MaterialIcons name={achievement.icon} color={rq.midnight} size={18} /></View><View style={styles.achievementCopy}><Text style={styles.achievementTitle}>{achievement.title}</Text><Text style={styles.achievementBody}>{achievement.description}</Text></View></View>;
          })}
        </Panel> : null}

        <Panel style={styles.nextPanel}><Text style={styles.nextLabel}>NEXT FIELD INSTRUCTION</Text><Text style={styles.nextText}>{contractCompleted ? "Tomorrow’s contract will rotate at midnight. Revisit a mapped cell in a future outing to advance Cartography Mastery." : "Take another expedition when you are ready—the contract remains active for the rest of today."}</Text></Panel>
        <PrimaryButton label="Return to Quest" icon="arrow-forward" onPress={finish} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 34, paddingBottom: 18, gap: 16 },
  heroIcon: { width: 64, height: 64, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: rq.teal, alignSelf: "center" },
  eyebrow: { color: rq.teal, textAlign: "center", fontSize: 10, letterSpacing: 1.3, fontWeight: "900" },
  title: { color: rq.cloud, fontSize: 29, lineHeight: 35, letterSpacing: -0.8, fontWeight: "900", textAlign: "center" },
  body: { color: rq.mist, fontSize: 14, lineHeight: 20, textAlign: "center", fontWeight: "500", paddingHorizontal: 8 },
  summary: { gap: 14 },
  metricRow: { flexDirection: "row", gap: 10 },
  levelUp: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderTopWidth: 1, borderTopColor: rq.border, paddingTop: 13 },
  levelUpText: { color: rq.gold, fontSize: 14, fontWeight: "900" },
  contract: { gap: 10 },
  contractCompleted: { borderColor: rq.teal + "99", backgroundColor: rq.teal + "16" },
  contractTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  contractEyebrow: { color: rq.mist, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  contractTitle: { color: rq.cloud, fontSize: 18, fontWeight: "900", marginTop: 3 },
  contractInstruction: { color: rq.mist, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  contractTrack: { height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: rq.midnight },
  contractFill: { height: "100%", borderRadius: 4, backgroundColor: rq.teal },
  contractFooter: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  contractProgress: { color: rq.cloud, fontSize: 12, fontWeight: "800" },
  contractReward: { color: rq.gold, fontSize: 12, fontWeight: "900" },
  achievementPanel: { gap: 10, borderColor: rq.gold + "88", backgroundColor: rq.gold + "12" },
  achievementEyebrow: { color: rq.gold, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  achievementRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  achievementIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: rq.gold },
  achievementCopy: { flex: 1, gap: 2 },
  achievementTitle: { color: rq.cloud, fontSize: 14, fontWeight: "900" },
  achievementBody: { color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  nextPanel: { gap: 6 },
  nextLabel: { color: rq.cyan, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  nextText: { color: rq.mist, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  empty: { gap: 16 },
  emptyTitle: { color: rq.cloud, fontSize: 18, fontWeight: "800", textAlign: "center" },
});
