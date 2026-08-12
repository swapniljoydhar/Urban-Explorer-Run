import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { LoadingState, Panel, PrimaryButton, rq, SmallButton, StatePill } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { useRunQuest } from "@/lib/runquest/context";
import type { RunQuestCapability } from "@/lib/runquest/types";

function CapabilityCard({ icon, capability }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; capability: RunQuestCapability }) {
  return <Panel style={styles.capability}><View style={styles.capabilityTop}><View style={styles.capabilityIcon}><MaterialIcons name={icon} size={19} color={rq.cyan} /></View><StatePill state={capability.state} /></View><Text style={styles.capabilityLabel}>{capability.label}</Text><Text style={styles.capabilityDetail}>{capability.detail}</Text></Panel>;
}

export default function SettingsScreen() {
  const { hydrated, state, capabilities, refreshCapabilities, setTrackingMode, setHapticsEnabled, setReduceMotion, offlineAction, downloadCurrentOfflineRegion, removeOfflineRegion } = useRunQuest();
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

        <Panel style={styles.offlinePanel}>
          <View style={styles.offlineHeader}><View><Text style={styles.offlineEyebrow}>OFFLINE ATLAS PACKS</Text><Text style={styles.offlineTitle}>{state.offlineRegions.length} / 4 regions prepared</Text></View><MaterialIcons name="download-for-offline" color={rq.teal} size={26} /></View>
          <Text style={styles.offlineBody}>Prepare a compact 3 × 3 local tile pack around your latest expedition point. During an offline expedition, RunQuest shows this saved Atlas base with your route and discoveries on top.</Text>
          {offlineAction.state === "DOWNLOADING" ? <View style={styles.downloadProgress}><View style={styles.downloadTrack}><View style={[styles.downloadFill, { width: `${Math.max(5, offlineAction.total ? offlineAction.completed / offlineAction.total * 100 : 5)}%` }]} /></View><Text style={styles.downloadLabel}>{offlineAction.completed} / {offlineAction.total} tiles saved</Text></View> : null}
          {offlineAction.message ? <Text style={[styles.offlineMessage, offlineAction.state === "ERROR" && styles.offlineError]}>{offlineAction.message}</Text> : null}
          {state.offlineRegions.map((region) => <View key={region.id} style={styles.regionRow}><View style={styles.regionIcon}><MaterialIcons name="map" color={rq.gold} size={18} /></View><View style={styles.regionCopy}><Text style={styles.regionTitle}>Atlas pack · zoom {region.zoom}</Text><Text style={styles.regionDetail}>{region.tileCount} tiles · saved {new Date(region.downloadedAt).toLocaleDateString()}</Text></View><SmallButton label="Remove" onPress={() => void removeOfflineRegion(region.id)} /></View>)}
          <PrimaryButton label={offlineAction.state === "DOWNLOADING" ? "Preparing local map…" : "Prepare offline Atlas pack"} icon="download" tone="slate" disabled={offlineAction.state === "DOWNLOADING" || state.offlineRegions.length >= 4} onPress={() => void downloadCurrentOfflineRegion()} />
          <Text style={styles.offlineCredit}>Base tiles © OpenStreetMap contributors. Packs are intentionally small and removable to protect device storage.</Text>
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
  offlinePanel: { gap: 11, backgroundColor: rq.teal + "0F", borderColor: rq.teal + "45" },
  offlineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  offlineEyebrow: { color: rq.teal, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  offlineTitle: { color: rq.cloud, fontSize: 16, fontWeight: "900", marginTop: 3 },
  offlineBody: { color: rq.mist, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  downloadProgress: { gap: 5 },
  downloadTrack: { height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: rq.midnight },
  downloadFill: { height: "100%", borderRadius: 4, backgroundColor: rq.teal },
  downloadLabel: { color: rq.teal, fontSize: 11, fontWeight: "800" },
  offlineMessage: { color: rq.teal, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  offlineError: { color: rq.coral },
  regionRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingTop: 10, borderTopWidth: 1, borderTopColor: rq.border },
  regionIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: rq.gold + "18" },
  regionCopy: { flex: 1, gap: 2 },
  regionTitle: { color: rq.cloud, fontSize: 12, fontWeight: "800" },
  regionDetail: { color: rq.mist, fontSize: 10, fontWeight: "600" },
  offlineCredit: { color: rq.mist, fontSize: 10, lineHeight: 15, fontWeight: "500" },
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
