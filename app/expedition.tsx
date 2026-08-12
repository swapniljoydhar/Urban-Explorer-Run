import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { GeographicMap } from "@/components/runquest/geographic-map";
import { ContractProgress } from "@/components/runquest/contract-progress";
import { Metric, Panel, PrimaryButton, rq, SmallButton, StatePill } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance, formatDuration } from "@/lib/runquest/format";
import { formatContractProgress, getContractProgress, getDailyContract, isContractClaimed } from "@/lib/runquest/contracts";
import { useRunQuest } from "@/lib/runquest/context";
import { lightFeedback, mediumFeedback, successFeedback } from "@/lib/runquest/feedback";

function ActiveScreenLock() {
  useKeepAwake("runquest-expedition", { suppressDeactivateWarnings: true });
  return null;
}

export default function ExpeditionScreen() {
  const router = useRouter();
  const { activeExpedition, state, pauseExpedition, resumeExpedition, endExpedition, recordDemoDiscovery } = useRunQuest();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  const active = activeExpedition;
  const isPaused = active?.status === "paused";
  const duration = useMemo(() => active ? formatDuration(active.startedAt, now) : "0:00", [active, now]);
  const contract = getDailyContract();
  const contractProgress = getContractProgress(state, contract, active);
  const contractClaimed = isContractClaimed(state, contract);

  if (!active) {
    return (
      <ScreenContainer className="px-5 justify-center" safeAreaClassName="bg-background">
        <Panel style={styles.empty}><Text style={styles.emptyTitle}>No active expedition</Text><PrimaryButton label="Return to Quest" icon="arrow-back" onPress={() => router.replace("/(tabs)")} /></Panel>
      </ScreenContainer>
    );
  }

  const handlePause = () => {
    mediumFeedback(state.settings.hapticsEnabled);
    if (isPaused) resumeExpedition(); else pauseExpedition();
  };
  const handleEnd = async () => {
    successFeedback(state.settings.hapticsEnabled);
    await endExpedition();
    router.replace("/report");
  };
  const handleDemo = () => {
    recordDemoDiscovery();
    lightFeedback(state.settings.hapticsEnabled);
  };

  return (
    <ScreenContainer className="px-5" safeAreaClassName="bg-background">
      {!isPaused ? <ActiveScreenLock /> : null}
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Minimize expedition" style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><MaterialIcons name="keyboard-arrow-down" size={28} color={rq.cloud} /></Pressable>
          <StatePill state={active.mode === "live" ? "AVAILABLE" : "LIMITED"} label={active.mode === "live" ? "LIVE EXPEDITION" : "DEMO EXPEDITION"} />
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.mapWrap}>
          <GeographicMap route={active.route} tiles={Object.values(state.tiles)} currentPoint={active.lastPoint} offlineRegion={state.offlineRegions[0] ?? null} mapStyleUrl={state.settings.mapStyleUrl} />
          <View style={styles.mapOverlay}><Text style={styles.mapEyebrow}>GEOGRAPHIC EXPEDITION MAP</Text><Text style={styles.mapTitle}>Your route and atlas cells appear here.</Text></View>
        </View>

        <Panel style={styles.metricsPanel}>
          <View style={styles.metricRow}>
            <Metric label="Distance" value={formatDistance(active.distanceMeters)} accent={rq.teal} />
            <Metric label="Duration" value={duration} accent={rq.cloud} />
            <Metric label="New cells" value={String(active.newTileIds.length)} accent={rq.gold} />
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}><View style={styles.liveDot} /><Text style={styles.notice}>{active.notice}</Text></View>
        </Panel>

        <Panel style={styles.contractPanel}>
          <View style={styles.contractTop}><View><Text style={styles.contractEyebrow}>ACTIVE FIELD CONTRACT</Text><Text style={styles.contractTitle}>{contract.title}</Text></View><StatePill state={contractClaimed ? "AVAILABLE" : "LIMITED"} label={contractClaimed ? "CLAIMED" : `${contract.rewardXp} XP`} /></View>
          <Text style={styles.contractCopy}>{contract.instruction}</Text>
          <ContractProgress progress={contractProgress} target={contract.target} label={formatContractProgress(contract, contractProgress)} reduceMotion={state.settings.reduceMotion} claimed={contractClaimed} compact />
        </Panel>

        {active.mode === "demo" ? <PrimaryButton label="Simulate a discovery" icon="add-location-alt" onPress={handleDemo} tone="slate" disabled={isPaused} /> : null}

        <View style={styles.controls}>
          <SmallButton label={isPaused ? "Resume" : "Pause"} onPress={handlePause} active={isPaused} />
          <View style={styles.controlSpacer} />
          <PrimaryButton label="Finish" icon="flag" onPress={handleEnd} tone="coral" />
        </View>
        <Text style={styles.safety}>Foreground-first tracking · No cloud account required · Your local session is saved when you finish.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 12, paddingBottom: 16, gap: 16 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 42, height: 42, borderRadius: 16, backgroundColor: rq.deepSlate, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: rq.border },
  iconSpacer: { width: 42 },
  mapWrap: { flex: 1, minHeight: 260, borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: rq.border, backgroundColor: rq.midnight },
  mapOverlay: { position: "absolute", left: 16, right: 16, top: 16, borderRadius: 16, padding: 12, backgroundColor: rq.midnight + "DD" },
  mapEyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 1, fontWeight: "800" },
  mapTitle: { color: rq.cloud, fontSize: 16, fontWeight: "800", marginTop: 3 },
  metricsPanel: { gap: 13 },
  metricRow: { flexDirection: "row", gap: 12 },
  divider: { height: 1, backgroundColor: rq.border },
  statusRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: rq.teal },
  notice: { flex: 1, color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  contractPanel: { gap: 8 },
  contractTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  contractEyebrow: { color: rq.cyan, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  contractTitle: { color: rq.cloud, fontSize: 15, fontWeight: "900", marginTop: 3 },
  contractCopy: { color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  controls: { flexDirection: "row", alignItems: "center", gap: 12 },
  controlSpacer: { flex: 1 },
  safety: { color: rq.mist, textAlign: "center", fontSize: 11, lineHeight: 16, paddingHorizontal: 12 },
  empty: { gap: 16 },
  emptyTitle: { color: rq.cloud, fontSize: 19, fontWeight: "800", textAlign: "center" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
