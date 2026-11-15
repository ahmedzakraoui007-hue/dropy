import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Card, Hero, type IconName, useToast } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { pushPermission, registerForPush, unregisterPush } from "@/lib/push";
import { useSession } from "@/lib/session";
import { API_URL, storeLink } from "@/lib/supabase";
import { colors } from "@/lib/theme";

export default function StoreTab() {
  const { t, locale, setLocale } = useI18n();
  const { store, signOut, refreshStores } = useSession();
  const toast = useToast();
  const [notif, setNotif] = useState<"granted" | "denied" | "undetermined">("undetermined");

  useFocusEffect(
    useCallback(() => {
      refreshStores();
      pushPermission().then(setNotif).catch(() => {});
    }, [refreshStores])
  );

  const url = store ? storeLink(store) : "";
  const viewUrl = store ? (store.is_active === false ? `${API_URL}/preview/${store.slug}` : url) : "";

  const enableNotifications = async () => {
    const result = await registerForPush(true);
    if (result === "denied") toast(t("notifications.denied"), "error");
    else if (result === "unsupported") toast(t("notifications.device_only"), "error");
    setNotif(await pushPermission());
  };

  const logout = () =>
    Alert.alert(t("store.logout_confirm"), "", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("store.logout"),
        style: "destructive",
        onPress: async () => {
          await unregisterPush();
          await signOut();
        },
      },
    ]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Hero title={t("store.title")} />
      <View style={{ padding: 16, gap: 12 }}>
        {store ? (
          <Card style={s.storeCard}>
            <View style={s.logo}>
              {store.logo_url ? <Image source={store.logo_url} style={StyleSheet.absoluteFill} contentFit="contain" /> : <Ionicons name="storefront" size={26} color={colors.purple} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.storeName} numberOfLines={1}>
                {store.name}
              </Text>
              <Text style={s.storeUrl} numberOfLines={1}>
                {url.replace(/^https?:\/\//, "")}
              </Text>
              <View style={[s.state, { backgroundColor: store.is_active === false ? colors.warningSoft : colors.successSoft }]}>
                <View style={[s.dot, { backgroundColor: store.is_active === false ? colors.warning : colors.success }]} />
                <Text style={[s.stateText, { color: store.is_active === false ? "#92400E" : "#065F46" }]}>{store.is_active === false ? t("store.offline") : t("store.online")}</Text>
              </View>
            </View>
          </Card>
        ) : null}

        <Card style={s.group}>
          {store ? <Row icon="open-outline" label={t("store.open")} onPress={() => Linking.openURL(viewUrl)} /> : null}
          {store ? <Row icon="share-social-outline" label={t("store.share")} onPress={() => Share.share({ message: t("store.share_message", { name: store.name, url }) })} /> : null}
          <Row icon="desktop-outline" label={t("store.dashboard")} hint={t("store.dashboard_hint")} onPress={() => Linking.openURL(`${API_URL}/seller/dashboard`)} last />
        </Card>

        <Card style={s.group}>
          <Row
            icon="notifications-outline"
            label={t("store.notifications")}
            right={<Text style={[s.value, { color: notif === "granted" ? colors.success : colors.purple }]}>{notif === "granted" ? t("store.notifications_on") : t("home.enable")}</Text>}
            onPress={notif === "granted" ? undefined : enableNotifications}
          />
          <Row
            icon="language-outline"
            label={t("store.language")}
            right={
              <View style={s.segment}>
                {(["fr", "ar"] as const).map((l) => (
                  <Pressable key={l} onPress={() => setLocale(l)} style={[s.segmentItem, locale === l && s.segmentActive]}>
                    <Text style={[s.segmentText, locale === l && { color: "#fff" }]}>{l === "fr" ? "FR" : "عربي"}</Text>
                  </Pressable>
                ))}
              </View>
            }
          />
          <Row icon="help-circle-outline" label={t("store.help")} onPress={() => Linking.openURL(`${API_URL}/contact`)} last />
        </Card>

        <Card style={s.group}>
          <Row icon="log-out-outline" label={t("store.logout")} danger onPress={logout} last />
        </Card>

        <Text style={s.version}>{t("store.version", { version: Constants.expoConfig?.version || "1.0.0" })}</Text>
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, hint, right, onPress, danger, last }: { icon: IconName; label: string; hint?: string; right?: ReactNode; onPress?: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, !last && s.rowBorder, pressed && onPress && { backgroundColor: colors.bg }]}>
      <View style={[s.rowIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={19} color={danger ? colors.danger : colors.purple} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
        {hint ? <Text style={s.rowHint}>{hint}</Text> : null}
      </View>
      {right ?? (onPress && !danger ? <Ionicons name="chevron-forward" size={18} color={colors.faint} /> : null)}
    </Pressable>
  );
}

const s = StyleSheet.create({
  storeCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.purpleSoft, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  storeName: { fontSize: 18, fontWeight: "900", color: colors.ink },
  storeUrl: { fontSize: 13, color: colors.muted, marginTop: 2 },
  state: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  stateText: { fontSize: 12, fontWeight: "800" },
  group: { padding: 0, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.purpleSoft, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15, fontWeight: "700", color: colors.ink },
  rowHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  value: { fontSize: 14, fontWeight: "800" },
  segment: { flexDirection: "row", backgroundColor: colors.bg, borderRadius: 10, padding: 3 },
  segmentItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  segmentActive: { backgroundColor: colors.ink },
  segmentText: { fontSize: 13, fontWeight: "800", color: colors.text },
  version: { textAlign: "center", color: colors.faint, fontSize: 12, marginTop: 8 },
});
