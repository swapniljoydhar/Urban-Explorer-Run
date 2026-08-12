import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { LoadingState, Panel, PrimaryButton, rq, SmallButton, StatePill } from "@/components/runquest/primitives";
import { ScreenContainer } from "@/components/screen-container";
import { useRunQuest } from "@/lib/runquest/context";
import type { OfflineRegionInspection } from "@/lib/runquest/offline-packages";
import type { RunQuestCapability } from "@/lib/runquest/types";
import { getTileProvider, normalizeMapStyleUrl, OPENFREEMAP_ATTRIBUTION, OPENFREEMAP_STYLE_URL } from "@/lib/runquest/map-providers";

function CapabilityCard({ icon, capability }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; capability: RunQuestCapability }) {
  return <Panel style={styles.capability}><View style={styles.capabilityTop}><View style={styles.capabilityIcon}><MaterialIcons name={icon} size={19} color={rq.cyan} /></View><StatePill state={capability.state} /></View><Text style={styles.capabilityLabel}>{capability.label}</Text><Text style={styles.capabilityDetail}>{capability.detail}</Text></Panel>;
}

export default function SettingsScreen() {
  const { hydrated, state, capabilities, refreshCapabilities, setTrackingMode, setHapticsEnabled, setReduceMotion, setMapStyleUrl, offlineAction, downloadCurrentOfflineRegion, removeOfflineRegion, setActiveOfflineRegion, inspectOfflineRegion, repairOfflineRegion, importOfflineArchive, exportOfflineArchive, removeOfflineArchive } = useRunQuest();
  const [styleDraft, setStyleDraft] = useState(OPENFREEMAP_STYLE_URL);
  const [regionInspections, setRegionInspections] = useState<Record<string, OfflineRegionInspection>>({});
  const [providerMessage, setProviderMessage] = useState<string | null>(null);
  useEffect(() => {
    if (hydrated) setStyleDraft(state.settings.mapStyleUrl);
  }, [hydrated, state.settings.mapStyleUrl]);
  if (!hydrated) return <LoadingState />;
  const caps = capabilities;
  const provider = getTileProvider(state.settings.mapProvider);
  const formatBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const verifyRegion = async (id: string) => {
    const inspection = await inspectOfflineRegion(id);
    if (inspection) setRegionInspections((previous) => ({ ...previous, [id]: inspection }));
  };
  const repairRegion = async (id: string) => {
    await repairOfflineRegion(id);
    await verifyRegion(id);
  };
  const saveProvider = () => {
    const normalized = normalizeMapStyleUrl(styleDraft);
    if (!normalized) {
      setProviderMessage("Use a complete HTTPS MapLibre style URL.");
      return;
    }
    setMapStyleUrl(normalized);
    setProviderMessage("Map source saved. Existing offline packs remain unchanged.");
  };
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

        <Panel style={styles.providerPanel}>
          <View style={styles.offlineHeader}><View><Text style={styles.offlineEyebrow}>OPEN MAP PROVIDER</Text><Text style={styles.offlineTitle}>{provider.label}</Text></View><MaterialIcons name="public" color={rq.cyan} size={26} /></View>
          <Text style={styles.offlineBody}>RunQuest uses the open-source OpenFreeMap Liberty vector style. You can point MapLibre at a permitted self-hosted style without adding an account or Google service.</Text>
          <Text style={styles.inputLabel}>MapLibre style URL</Text>
          <TextInput value={styleDraft} onChangeText={(value) => { setStyleDraft(value); setProviderMessage(null); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="done" style={styles.urlInput} placeholder="https://…/style.json" placeholderTextColor={rq.mist} accessibilityLabel="MapLibre style URL" />
          {providerMessage ? <Text style={styles.providerMessage}>{providerMessage}</Text> : null}
          <View style={styles.providerActions}><PrimaryButton label="Save source" icon="save" tone="slate" onPress={saveProvider} /><SmallButton label="Use OpenFreeMap" onPress={() => { setStyleDraft(OPENFREEMAP_STYLE_URL); setMapStyleUrl(OPENFREEMAP_STYLE_URL); setProviderMessage("OpenFreeMap Liberty restored."); }} /></View>
          <Text style={styles.offlineCredit}>{OPENFREEMAP_ATTRIBUTION}. {provider.offlineNote}</Text>
        </Panel>

        <Panel style={styles.offlinePanel}>
          <View style={styles.offlineHeader}><View><Text style={styles.offlineEyebrow}>OFFLINE ATLAS PACKS</Text><Text style={styles.offlineTitle}>{state.offlineRegions.length} / 4 regions prepared</Text></View><MaterialIcons name="download-for-offline" color={rq.teal} size={26} /></View>
          <Text style={styles.offlineBody}>Existing local packs remain readable. New public-tile downloads are paused until a provider that explicitly permits offline archives is configured. During an offline expedition, RunQuest can still show an installed pack with your route and discoveries on top.</Text>
          {offlineAction.state === "DOWNLOADING" ? <View style={styles.downloadProgress}><View style={styles.downloadTrack}><View style={[styles.downloadFill, { width: `${Math.max(5, offlineAction.total ? offlineAction.completed / offlineAction.total * 100 : 5)}%` }]} /></View><Text style={styles.downloadLabel}>{offlineAction.completed} / {offlineAction.total} tiles saved</Text></View> : null}
          {offlineAction.message ? <Text style={[styles.offlineMessage, offlineAction.state === "ERROR" && styles.offlineError]}>{offlineAction.message}</Text> : null}
          {state.offlineRegions.map((region) => {
            const inspection = regionInspections[region.id];
            const isActive = state.activeOfflineRegionId === region.id || (!state.activeOfflineRegionId && state.offlineRegions[0]?.id === region.id);
            return <View key={region.id} style={[styles.regionRow, isActive && styles.activeRegionRow]}>
              <View style={styles.regionIcon}><MaterialIcons name={isActive ? "check-circle" : "map"} color={isActive ? rq.teal : rq.gold} size={18} /></View>
              <View style={styles.regionCopy}><Text style={styles.regionTitle}>{isActive ? "Active Atlas pack" : "Atlas pack"} · zoom {region.zoom}</Text><Text style={styles.regionDetail}>{region.tileCount} tiles · {region.provider} · {region.latitude.toFixed(3)}, {region.longitude.toFixed(3)}</Text><Text style={styles.regionStatus}>{inspection ? `${inspection.status} · ${inspection.presentTiles}/${inspection.expectedTiles} tiles · ${formatBytes(inspection.bytes)}` : `saved ${new Date(region.downloadedAt).toLocaleDateString()}`}</Text></View>
              <View style={styles.regionActions}><SmallButton label={isActive ? "Active" : "Use"} active={isActive} onPress={() => setActiveOfflineRegion(region.id)} /><SmallButton label="Verify" onPress={() => void verifyRegion(region.id)} /><SmallButton label="Repair" onPress={() => void repairRegion(region.id)} /><SmallButton label="Remove" onPress={() => void removeOfflineRegion(region.id)} /></View>
            </View>;
          })}
          <PrimaryButton label={offlineAction.state === "DOWNLOADING" ? "Preparing local map…" : "Check offline source"} icon="download" tone="slate" disabled={offlineAction.state === "DOWNLOADING" || state.offlineRegions.length >= 4} onPress={() => void downloadCurrentOfflineRegion()} />
          <Text style={styles.offlineCredit}>Existing packs retain their source metadata. New offline archives must come from a provider that explicitly permits offline use and must remain attributable and removable.</Text>
        </Panel>

        <Panel style={styles.archivePanel}>
          <View style={styles.offlineHeader}><View><Text style={styles.offlineEyebrow}>LOCAL ARCHIVE LIBRARY</Text><Text style={styles.offlineTitle}>{state.offlineArchives.length} imported archives</Text></View><MaterialIcons name="folder-special" color={rq.gold} size={26} /></View>
          <Text style={styles.offlineBody}>Import a permitted PMTiles or MBTiles file from device storage. RunQuest copies it into its private local archive directory; it never downloads archive contents from a public tile endpoint.</Text>
          {state.offlineArchives.map((archive) => <View key={archive.id} style={styles.archiveRow}><View style={styles.regionIcon}><MaterialIcons name={archive.format === "PMTiles" ? "layers" : "storage"} color={rq.gold} size={18} /></View><View style={styles.regionCopy}><Text style={styles.regionTitle}>{archive.name}</Text><Text style={styles.regionDetail}>{archive.format} · {formatBytes(archive.sizeBytes)} · imported {new Date(archive.importedAt).toLocaleDateString()}</Text></View><View style={styles.regionActions}><SmallButton label="Export" onPress={() => void exportOfflineArchive(archive.id)} /><SmallButton label="Remove" onPress={() => void removeOfflineArchive(archive.id)} /></View></View>)}
          <PrimaryButton label="Import PMTiles / MBTiles" icon="file-upload" tone="slate" disabled={state.offlineArchives.length >= 8} onPress={() => void importOfflineArchive()} />
          <Text style={styles.offlineCredit}>Archive files are validated by extension and bounded to 1 GB. Format indexing and direct MapLibre archive rendering require a later native proof-of-concept.</Text>
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
  providerPanel: { gap: 11, backgroundColor: rq.cyan + "0F", borderColor: rq.cyan + "45" },
  inputLabel: { color: rq.cloud, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  urlInput: { minHeight: 44, borderWidth: 1, borderColor: rq.border, borderRadius: 12, paddingHorizontal: 12, color: rq.cloud, backgroundColor: rq.midnight, fontSize: 12 },
  providerMessage: { color: rq.teal, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  providerActions: { flexDirection: "row", alignItems: "center", gap: 9, flexWrap: "wrap" },
  switchPanel: { gap: 14 },
  switchRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  switchCopy: { flex: 1, gap: 3 },
  switchTitle: { color: rq.cloud, fontSize: 14, fontWeight: "800" },
  switchBody: { color: rq.mist, fontSize: 12, lineHeight: 17, fontWeight: "500" },
  switchDivider: { height: 1, backgroundColor: rq.border },
  offlinePanel: { gap: 11, backgroundColor: rq.teal + "0F", borderColor: rq.teal + "45" },
  archivePanel: { gap: 11, backgroundColor: rq.gold + "0F", borderColor: rq.gold + "45" },
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
  regionRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingTop: 10, borderTopWidth: 1, borderTopColor: rq.border },
  activeRegionRow: { backgroundColor: rq.teal + "0D", borderRadius: 12, padding: 9, borderTopWidth: 0 },
  regionIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: rq.gold + "18" },
  regionCopy: { flex: 1, gap: 2 },
  regionTitle: { color: rq.cloud, fontSize: 12, fontWeight: "800" },
  regionDetail: { color: rq.mist, fontSize: 10, lineHeight: 14, fontWeight: "600" },
  regionStatus: { color: rq.teal, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  regionActions: { alignItems: "flex-end", gap: 5 },
  archiveRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingTop: 10, borderTopWidth: 1, borderTopColor: rq.border },
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
