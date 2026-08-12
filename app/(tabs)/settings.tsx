import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { LoadingState, Panel, rq, SmallButton, StatePill } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { useRunQuest } from "@/lib/runquest/context";
import type { RunQuestCapability } from "@/lib/runquest/types";

function CapabilityCard({ icon, capability }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; capability: RunQuestCapability }) {
  return <Panel style={styles.capability}><View style={styles.capabilityTop}><View style={styles.capabilityIcon}><MaterialIcons name={icon} size={19} color={rq.cyan} /></View><StatePill state={capability.state} /></View><Text style={styles.capabilityLabel}>{capability.label}</Text><Text style={styles.capabilityDetail}>{capability.detail}</Text></Panel>;
}

export default function SettingsScreen() {
  const { hydrated, state, capabilities, refreshCapabilities, setTrackingMode, setHapticsEnabled, setReduceMotion } = useRunQuest();
  if (!hydrated) return <LoadingState />;
  const caps = capabilities;
  return (
    <ScreenContainer className="px-5" safeAreaClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>SETTINGS / COMPATIBILITY</Text>
        <Text style={styles.title}>Designed to degrade honestly.</Text>
        <Text style={styles.body}>RunQuest keeps its core local and explains exactly what this device can provide. No hidden capability assumptions.</Text>

        <Panel style={styles.controlPanel}>
          <Text style={styles.controlTitle}>Tracking preference</Text>
          <View style={styles.modeRow}><SmallButton label="Saver" active={state.settings.trackingMode === "battery-saver"} onPress={() => setTrackingMode("battery-saver")} /><SmallButton label="Balanced" active={state.settings.trackingMode === "balanced"} onPress={() => setTrackingMode("balanced")} /><SmallButton label="Precision" active={state.settings.trackingMode === "precision"} onPress={() => setTrackingMode("precision")} /></View>
          <Text style={styles.controlHelp}>Preferences tune foreground request cadence. They never change the meaning of already saved runs.</Text>
        </Panel>

        <Panel style={styles.switchPanel}>
          <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>Haptic feedback</Text><Text style={styles.switchBody}>Short feedback for start, pause, and new territory.</Text></View><Switch value={state.settings.hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={{ false: rq.border, true: rq.teal + "AA" }} thumbColor={state.settings.hapticsEnabled ? rq.teal : rq.mist} /></View>
          <View style={styles.switchDivider} />
          <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>Reduce motion</Text><Text style={styles.switchBody}>Use steady visual feedback in place of motion-heavy effects.</Text></View><Switch value={state.settings.reduceMotion} onValueChange={setReduceMotion} trackColor={{ false: rq.border, true: rq.teal + "AA" }} thumbColor={state.settings.reduceMotion ? rq.teal : rq.mist} /></View>
        </Panel>

        <View style={styles.capabilityHeader}><Text style={styles.controlTitle}>This device</Text><SmallButton label="Refresh" onPress={() => void refreshCapabilities()} /></View>
        {caps ? <View style={styles.capabilityGrid}><CapabilityCard icon="my-location" capability={caps.location} /><CapabilityCard icon="directions-walk" capability={caps.steps} /><CapabilityCard icon="stay-current-portrait" capability={caps.background} /><CapabilityCard icon="vibration" capability={caps.haptics} /><CapabilityCard icon="offline-bolt" capability={caps.offline} /></View> : <Panel><Text style={styles.controlHelp}>Checking compatible capabilities…</Text></Panel>}

        <Panel style={styles.privacy}><Text style={styles.privacyTitle}>Compatibility promise</Text><Text style={styles.privacyBody}>Future versions must read this local data, preserve existing tile identities, and provide fallbacks instead of breaking an older supported Android device.</Text></Panel>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 28, gap: 16 },
  eyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 1.25, fontWeight: "800" },
  title: { color: rq.cloud, fontSize: 28, lineHeight: 34, letterSpacing: -0.7, fontWeight: "800", marginTop: -8 },
  body: { color: rq.mist, fontSize: 14, lineHeight: 20, fontWeight: "500", marginTop: -8 },
  controlPanel: { gap: 13 },
  controlTitle: { color: rq.cloud, fontSize: 16, fontWeight: "800" },
  modeRow: { flexDirection: "row", gap: 8 },
  controlHelp: { color: rq.mist, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  switchPanel: { gap: 14 },
  switchRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  switchCopy: { flex: 1, gap: 3 },
  switchTitle: { color: rq.cloud, fontSize: 14, fontWeight: "800" },
  switchBody: { color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "500" },
  switchDivider: { height: 1, backgroundColor: rq.border },
  capabilityHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  capabilityGrid: { gap: 10 },
  capability: { gap: 8 },
  capabilityTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  capabilityIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: rq.cyan + "18" },
  capabilityLabel: { color: rq.cloud, fontSize: 14, fontWeight: "800" },
  capabilityDetail: { color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "500" },
  privacy: { gap: 7, backgroundColor: rq.teal + "13", borderColor: rq.teal + "45" },
  privacyTitle: { color: rq.teal, fontSize: 14, fontWeight: "800" },
  privacyBody: { color: rq.mist, fontSize: 12, lineHeight: 18, fontWeight: "500" },
});
