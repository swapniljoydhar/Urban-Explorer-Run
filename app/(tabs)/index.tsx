import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AtlasGrid } from "@/components/runquest/atlas-grid";
import { ContractProgress } from "@/components/runquest/contract-progress";
import { LoadingState, Metric, Panel, PrimaryButton, rq, StatePill } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { levelProgress } from "@/lib/runquest/engine";
import { formatContractProgress, getContractProgress, getDailyContract, isContractClaimed } from "@/lib/runquest/contracts";
import { formatDistance } from "@/lib/runquest/format";
import { useRunQuest } from "@/lib/runquest/context";
import { lightFeedback } from "@/lib/runquest/feedback";

export default function HomeScreen() {
  const router = useRouter();
  const { hydrated, state, capabilities, persistenceState, startExpedition } = useRunQuest();
  const level = levelProgress(state.profile.totalXp);
  const latestWorkout = state.workouts[0];
  const locationState = capabilities?.location.state ?? "LIMITED";
  const contract = getDailyContract();
  const contractProgress = getContractProgress(state, contract);
  const contractClaimed = isContractClaimed(state, contract);

  const handleStart = useCallback(async () => {
    lightFeedback(state.settings.hapticsEnabled);
    await startExpedition();
    router.push("/expedition");
  }, [router, startExpedition, state.settings.hapticsEnabled]);

  if (!hydrated) return <LoadingState />;

  return (
    <ScreenContainer containerClassName="bg-background" className="px-5" safeAreaClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>RUNQUEST / LOCAL ATLAS</Text>
            <Text style={styles.title}>Good to explore?</Text>
          </View>
          <StatePill state={locationState} label={locationState === "AVAILABLE" ? "LIVE READY" : "DEMO READY"} />
        </View>

        <Panel style={styles.levelPanel}>
          <View style={styles.levelTop}>
            <View>
              <Text style={styles.levelCaption}>LEVEL {level.currentLevel}</Text>
              <Text style={styles.levelTitle}>{state.profile.title}</Text>
            </View>
            <Text style={styles.xpTotal}>{state.profile.totalXp.toLocaleString()} XP</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(5, level.progress * 100)}%` }]} /></View>
          <Text style={styles.progressCaption}>{Math.max(0, level.nextFloor - state.profile.totalXp)} XP to level {level.currentLevel + 1}</Text>
        </Panel>

        <AtlasGrid discovered={Object.keys(state.tiles).length} />

        <Panel style={styles.objectivePanel}>
          <View style={styles.objectiveRow}>
          <View style={styles.objectiveIcon}><Text style={styles.objectiveIconText}>{contract.kind === "FRONTIER" ? "FX" : contract.kind === "ENDURANCE" ? "KM" : "GO"}</Text></View>
          <View style={styles.objectiveCopy}>
            <View style={styles.objectiveHeading}><Text style={styles.sectionLabel}>TODAY’S FIELD CONTRACT</Text><StatePill state={contractClaimed ? "AVAILABLE" : "LIMITED"} label={contractClaimed ? "CLAIMED" : `+${contract.rewardXp} XP`} /></View>
            <Text style={styles.objectiveTitle}>{contract.title}</Text>
            <Text style={styles.objectiveBody}>{contract.instruction}</Text>
          </View>
          </View>
          <ContractProgress progress={contractProgress} target={contract.target} label={`${formatContractProgress(contract, contractProgress)}${contractClaimed ? " · reward secured" : ""}`} reduceMotion={state.settings.reduceMotion} claimed={contractClaimed} />
        </Panel>

        <PrimaryButton label="Start expedition" icon="play-arrow" onPress={handleStart} />

        <Panel style={styles.statsPanel}>
          <Text style={styles.sectionLabel}>LOCAL EXPEDITION RECORD</Text>
          <View style={styles.metricRow}>
            <Metric label="Atlas cells" value={String(Object.keys(state.tiles).length)} accent={rq.teal} />
            <Metric label="Last distance" value={latestWorkout ? formatDistance(latestWorkout.distanceMeters) : "—"} accent={rq.cyan} />
            <Metric label="Runs saved" value={String(state.workouts.length)} accent={rq.gold} />
          </View>
          <View style={styles.ledgerRow}><View style={[styles.ledgerDot, { backgroundColor: persistenceState === "SAVED" ? rq.teal : persistenceState === "SAVING" ? rq.gold : rq.coral }]} /><Text style={styles.ledgerText}>{persistenceState === "SAVED" ? "Local ledger secured" : persistenceState === "SAVING" ? "Saving expedition data…" : "Save will retry when storage is available"}</Text></View>
          <Text style={styles.achievementCaption}>{state.profile.achievements.length} / 7 permanent achievements unlocked</Text>
        </Panel>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 30, gap: 18 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  eyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 1.35, fontWeight: "800", marginBottom: 5 },
  title: { color: rq.cloud, fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7 },
  levelPanel: { gap: 11 },
  levelTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  levelCaption: { color: rq.gold, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  levelTitle: { color: rq.cloud, fontSize: 19, lineHeight: 25, fontWeight: "800", marginTop: 3 },
  xpTotal: { color: rq.cloud, fontSize: 14, fontWeight: "800", alignSelf: "center" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: rq.midnight, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: rq.gold },
  progressCaption: { color: rq.mist, fontSize: 12, fontWeight: "600" },
  objectiveRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  objectivePanel: { gap: 11, backgroundColor: rq.cyan + "10", borderColor: rq.cyan + "44" },
  objectiveIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: rq.teal + "22", borderWidth: 1, borderColor: rq.teal + "55" },
  objectiveIconText: { color: rq.teal, fontWeight: "900", fontSize: 12 },
  objectiveCopy: { flex: 1, gap: 3 },
  objectiveHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  sectionLabel: { color: rq.mist, fontSize: 10, fontWeight: "800", letterSpacing: 1.05 },
  objectiveTitle: { color: rq.cloud, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  objectiveBody: { color: rq.mist, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  statsPanel: { gap: 15 },
  metricRow: { flexDirection: "row", gap: 10 },
  ledgerRow: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, borderTopColor: rq.border, paddingTop: 12 },
  ledgerDot: { width: 7, height: 7, borderRadius: 4 },
  ledgerText: { color: rq.mist, fontSize: 11, fontWeight: "700" },
  achievementCaption: { color: rq.gold, fontSize: 11, fontWeight: "800", marginTop: -6 },
});
