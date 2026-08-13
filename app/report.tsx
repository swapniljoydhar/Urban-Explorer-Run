import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Metric, Panel, PrimaryButton, rq, StatePill } from "@/components/runquest/primitives";
import { NatureSignal } from "@/components/runquest/nature-signal";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance } from "@/lib/runquest/format";
import { calculateLevel } from "@/lib/runquest/engine";
import { getAchievement } from "@/lib/runquest/achievements";
import { formatContractProgress } from "@/lib/runquest/contracts";
import { useRunQuest } from "@/lib/runquest/context";
import { getExpeditionStory, getMomentumDebrief, getNatureMoment } from "@/lib/runquest/nature";
import { formatZoneDuration } from "@/lib/runquest/pace-coaching";

const ZONE_ROWS = [
  { key: "easySeconds", label: "Easy", color: rq.teal },
  { key: "steadySeconds", label: "Steady", color: rq.cyan },
  { key: "briskSeconds", label: "Brisk", color: rq.gold },
  { key: "swiftSeconds", label: "Swift", color: rq.coral },
] as const;

export default function ReportScreen() {
  const router = useRouter();
  const { latestReport, dismissReport } = useRunQuest();

  if (!latestReport) {
    return <ScreenContainer className="px-5 justify-center" safeAreaClassName="bg-background"><Panel style={styles.empty}><Text style={styles.emptyTitle}>No expedition report is ready.</Text><PrimaryButton label="Return to Quest" icon="arrow-back" onPress={() => router.replace("/(tabs)")} /></Panel></ScreenContainer>;
  }

  const { workout, contract, contractProgress, contractCompleted, totalXpBefore, totalXpAfter, unlockedAchievementIds, momentum, newPersonalRecordKinds, fieldBrief } = latestReport;
  const startLevel = calculateLevel(totalXpBefore);
  const endLevel = calculateLevel(totalXpAfter);
  const paceSummary = workout.paceZoneSummary;
  const analyzedSeconds = paceSummary?.analyzedSeconds ?? 0;
  const finish = () => { dismissReport(); router.replace("/(tabs)"); };
  const natureMoment = getNatureMoment(workout.startedAt);

  return (
    <ScreenContainer className="px-5" safeAreaClassName="bg-background">
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        <View style={styles.heroIcon}><MaterialIcons name="terrain" color={rq.midnight} size={30} /></View>
        <Text style={styles.eyebrow}>FIELD NOTE RECORDED</Text>
        <Text style={styles.title}>{getExpeditionStory(workout.startedAt, workout.newTileCount)}</Text>
        <Text style={styles.body}>Your route and rewards now live in the private local atlas. Here is what this outing changed.</Text>

        <NatureSignal moment={natureMoment} compact />

        <Panel style={styles.summary}>
          <View style={styles.metricRow}><Metric label="Distance" value={formatDistance(workout.distanceMeters)} accent={rq.teal} /><Metric label="New cells" value={String(workout.newTileCount)} accent={rq.gold} /><Metric label="XP earned" value={`+${workout.xpEarned + workout.contractRewardXp}`} accent={rq.cyan} /></View>
          {endLevel > startLevel ? <View style={styles.levelUp}><MaterialIcons name="north-east" color={rq.gold} size={18} /><Text style={styles.levelUpText}>Level up: {startLevel} → {endLevel}</Text></View> : null}
        </Panel>

        <Panel style={styles.momentumPanel}>
          <View style={styles.momentumHeader}><View><Text style={styles.momentumEyebrow}>FIELD BRIEF / {fieldBrief.title.toUpperCase()}</Text><Text style={styles.momentumTitle}>{fieldBrief.objective}</Text></View><MaterialIcons name="explore" color={rq.teal} size={23} /></View>
          <Text style={styles.momentumBody}>{getMomentumDebrief(workout.newTileCount, momentum.currentStreak, newPersonalRecordKinds.length)}</Text>
          <View style={styles.momentumMetrics}><Metric label="Field streak" value={`${momentum.currentStreak} day${momentum.currentStreak === 1 ? "" : "s"}`} accent={rq.teal} /><Metric label="Best rhythm" value={`${momentum.longestStreak} day${momentum.longestStreak === 1 ? "" : "s"}`} accent={rq.gold} /></View>
        </Panel>

        <Panel style={styles.zonePanel}>
          <View style={styles.zoneHeader}><View><Text style={styles.zoneEyebrow}>ROUTE RHYTHM</Text><Text style={styles.zoneTitle}>Time in pace zones</Text></View><MaterialIcons name="timeline" color={rq.cyan} size={23} /></View>
          {analyzedSeconds > 0 ? <>
            <Text style={styles.zoneBody}>A local view of accepted moving route segments. It describes route rhythm, not health or training advice.</Text>
            <View style={styles.zoneRows}>{ZONE_ROWS.map((zone) => {
              const seconds = paceSummary?.[zone.key] ?? 0;
              const percent = Math.round(seconds / analyzedSeconds * 100);
              return <View key={zone.key} style={styles.zoneRow}><View style={styles.zoneRowTop}><Text style={styles.zoneLabel}>{zone.label}</Text><Text style={styles.zoneValue}>{formatZoneDuration(seconds)} · {percent}%</Text></View><View style={styles.zoneTrack}><View style={[styles.zoneFill, { width: `${Math.max(seconds ? 5 : 0, percent)}%`, backgroundColor: zone.color }]} /></View></View>;
            })}</View>
            {(paceSummary?.excludedSeconds ?? 0) > 0 ? <Text style={styles.zoneNote}>{formatZoneDuration(paceSummary?.excludedSeconds ?? 0)} excluded for pauses, long gaps, or unstable movement.</Text> : null}
          </> : <Text style={styles.zoneBody}>Not enough steady local route data formed a pace summary this time. Future reports will analyze accepted moving segments when the route has enough consistent samples.</Text>}
        </Panel>

        {newPersonalRecordKinds.length ? <Panel style={styles.recordPanel}>
          <Text style={styles.recordEyebrow}>NEW PERSONAL RECORD{newPersonalRecordKinds.length > 1 ? "S" : ""}</Text>
          <Text style={styles.recordText}>{newPersonalRecordKinds.map((kind) => kind === "LONGEST_DISTANCE" ? "Longest expedition" : kind === "MOST_NEW_CELLS" ? "Most new cells" : "Best steady pace").join(" · ")}</Text>
        </Panel> : null}

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
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 34, paddingBottom: 24, gap: 16 },
  heroIcon: { width: 64, height: 64, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: rq.teal, alignSelf: "center" },
  eyebrow: { color: rq.teal, textAlign: "center", fontSize: 10, letterSpacing: 1.3, fontWeight: "900" },
  title: { color: rq.cloud, fontSize: 29, lineHeight: 35, letterSpacing: -0.8, fontWeight: "900", textAlign: "center" },
  body: { color: rq.mist, fontSize: 14, lineHeight: 20, textAlign: "center", fontWeight: "500", paddingHorizontal: 8 },
  summary: { gap: 14 },
  metricRow: { flexDirection: "row", gap: 10 },
  levelUp: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderTopWidth: 1, borderTopColor: rq.border, paddingTop: 13 },
  levelUpText: { color: rq.gold, fontSize: 14, fontWeight: "900" },
  momentumPanel: { gap: 10, borderColor: rq.teal + "66", backgroundColor: rq.teal + "0D" },
  momentumHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  momentumEyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 0.9, fontWeight: "900" },
  momentumTitle: { color: rq.cloud, fontSize: 15, lineHeight: 21, fontWeight: "900", marginTop: 3 },
  momentumBody: { color: rq.mist, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  momentumMetrics: { flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: rq.border, paddingTop: 10 },
  zonePanel: { gap: 10, backgroundColor: rq.cyan + "0D", borderColor: rq.cyan + "55" },
  zoneHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  zoneEyebrow: { color: rq.cyan, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  zoneTitle: { color: rq.cloud, fontSize: 16, fontWeight: "900", marginTop: 3 },
  zoneBody: { color: rq.mist, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  zoneRows: { gap: 9 },
  zoneRow: { gap: 4 },
  zoneRowTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  zoneLabel: { color: rq.cloud, fontSize: 12, fontWeight: "800" },
  zoneValue: { color: rq.mist, fontSize: 11, fontWeight: "700" },
  zoneTrack: { height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: rq.midnight },
  zoneFill: { height: "100%", borderRadius: 4 },
  zoneNote: { color: rq.mist, fontSize: 10, lineHeight: 15, fontWeight: "600" },
  recordPanel: { gap: 4, borderColor: rq.gold + "88", backgroundColor: rq.gold + "12" },
  recordEyebrow: { color: rq.gold, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  recordText: { color: rq.cloud, fontSize: 14, lineHeight: 20, fontWeight: "900" },
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
