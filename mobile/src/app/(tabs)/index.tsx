import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { OrderRow } from "@/components/OrderRow";
import { Button, Card, EmptyState, Hero, SectionTitle } from "@/components/ui";
import { money, startOfDay } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { ORDER_LIST_COLUMNS, type Order } from "@/lib/orders";
import { pushPermission, registerForPush } from "@/lib/push";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Stats = {
  todaySales: number;
  todayOrders: number;
  pending: number;
  inProgress: number;
  weekSales: number;
  days: { label: string; total: number }[];
  toCall: Order[];
};

const ACTIVE = ["confirmed", "preparing", "shipped"];

export default function Home() {
  const { t, locale } = useI18n();
  const { profile, store, storeIds } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notif, setNotif] = useState<"granted" | "denied" | "undetermined">("granted");
  const [openLeads, setOpenLeads] = useState(0);

  const load = useCallback(async () => {
    if (!storeIds.length) return;
    const today = startOfDay();
    const weekStart = startOfDay(new Date(today.getTime() - 6 * 86400000));
    const [{ data: week }, { data: toCall }, { count: inProgress }] = await Promise.all([
      supabase.from("store_orders").select("status, total_amount, created_at").in("store_id", storeIds).gte("created_at", weekStart.toISOString()),
      supabase.from("store_orders").select(ORDER_LIST_COLUMNS).in("store_id", storeIds).eq("status", "new").order("created_at", { ascending: false }).limit(5),
      supabase.from("store_orders").select("id", { count: "exact", head: true }).in("store_id", storeIds).in("status", ACTIVE),
    ]);
    const { count: pending } = await supabase.from("store_orders").select("id", { count: "exact", head: true }).in("store_id", storeIds).eq("status", "new");
    const { count: leadCount } = await supabase.from("store_order_leads").select("id", { count: "exact", head: true }).in("store_id", storeIds).eq("status", "open");
    setOpenLeads(leadCount || 0);
    const rows = (week || []).filter((o) => o.status !== "cancelled");
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-FR", { weekday: "narrow" });
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(weekStart.getTime() + i * 86400000);
      const end = start.getTime() + 86400000;
      const total = rows.filter((o) => {
        const ts = new Date(o.created_at).getTime();
        return ts >= start.getTime() && ts < end;
      }).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      return { label: fmt.format(start), total };
    });
    const todayRows = rows.filter((o) => new Date(o.created_at) >= today);
    setStats({
      todaySales: todayRows.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      todayOrders: todayRows.length,
      pending: pending || 0,
      inProgress: inProgress || 0,
      weekSales: rows.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      days,
      toCall: (toCall || []) as unknown as Order[],
    });
    setNotif(await pushPermission().catch(() => "granted" as const));
  }, [storeIds.join(","), locale]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = (profile?.full_name || "").split(" ")[0];

  if (!store) {
    return (
      <View style={{ flex: 1 }}>
        <Hero title={t("tabs.home")} />
        <EmptyState icon="storefront-outline" title={t("home.no_store")} />
      </View>
    );
  }

  const max = Math.max(1, ...(stats?.days.map((d) => d.total) || [1]));

  return (
    <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />} contentContainerStyle={{ paddingBottom: 32 }}>
      <Hero title={store.name} subtitle={firstName ? t("home.hello", { name: firstName }) : t("home.today")}>
        <View style={s.kpis}>
          <View style={s.kpiMain}>
            <Text style={s.kpiLabel}>{t("home.today_sales")}</Text>
            <Text style={s.kpiValue}>{stats ? money(stats.todaySales, locale) : "—"}</Text>
            <Text style={s.kpiSub}>
              {stats ? `${stats.todayOrders} · ${t("home.today_orders").toLowerCase()}` : " "}
            </Text>
          </View>
        </View>
        <View style={s.kpiRow}>
          <Pressable style={[s.kpiSmall, { borderColor: "rgba(251,191,36,0.4)" }]} onPress={() => router.push({ pathname: "/(tabs)/orders", params: { status: "new" } })}>
            <Text style={[s.kpiSmallValue, { color: "#FCD34D" }]}>{stats?.pending ?? "—"}</Text>
            <Text style={s.kpiSmallLabel}>{t("home.to_confirm")}</Text>
          </Pressable>
          <Pressable style={s.kpiSmall} onPress={() => router.push({ pathname: "/(tabs)/orders", params: { status: "confirmed" } })}>
            <Text style={s.kpiSmallValue}>{stats?.inProgress ?? "—"}</Text>
            <Text style={s.kpiSmallLabel}>{t("home.in_progress")}</Text>
          </Pressable>
        </View>
      </Hero>

      <View style={{ paddingHorizontal: 16 }}>
        {store.is_active === false ? (
          <Card style={[s.banner, { backgroundColor: colors.warningSoft, borderColor: "#FDE68A" }]}>
            <Ionicons name="eye-off" size={20} color={colors.warning} />
            <Text style={[s.bannerText, { color: "#92400E" }]}>{t("home.store_offline")}</Text>
          </Card>
        ) : null}

        {openLeads > 0 ? (
          <Pressable onPress={() => router.push("/leads")}>
            <Card style={[s.banner, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
              <Ionicons name="cart" size={20} color="#C2410C" />
              <Text style={[s.bannerText, { color: "#9A3412" }]}>{openLeads === 1 ? t("leads.banner_one") : t("leads.banner", { count: openLeads })}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C2410C" />
            </Card>
          </Pressable>
        ) : null}

        {notif !== "granted" ? (
          <Card style={[s.banner, { backgroundColor: colors.purpleSoft, borderColor: "#DDD6FE" }]}>
            <Ionicons name="notifications" size={20} color={colors.purple} />
            <Text style={[s.bannerText, { color: "#4C1D95" }]}>{t("home.notifications_off")}</Text>
            <Pressable
              onPress={async () => {
                await registerForPush(true);
                setNotif(await pushPermission());
              }}
              hitSlop={8}
            >
              <Text style={s.bannerAction}>{t("home.enable")}</Text>
            </Pressable>
          </Card>
        ) : null}

        <SectionTitle title={t("home.week")} />
        <Card>
          <Text style={s.weekTotal}>{stats ? t("home.week_sales", { amount: money(stats.weekSales, locale) }) : " "}</Text>
          <View style={s.chart}>
            {(stats?.days || Array.from({ length: 7 }, () => ({ label: "", total: 0 }))).map((d, i) => (
              <View key={i} style={s.barCol}>
                <View style={s.barTrack}>
                  <View style={[s.bar, { height: `${Math.max(4, (d.total / max) * 100)}%`, backgroundColor: i === 6 ? colors.purple : colors.tealSoft }]} />
                </View>
                <Text style={[s.barLabel, i === 6 && { color: colors.purple }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <SectionTitle
          title={t("home.to_call")}
          action={stats?.pending ? t("home.see_all") : undefined}
          onAction={() => router.push({ pathname: "/(tabs)/orders", params: { status: "new" } })}
        />
        {stats && stats.toCall.length ? (
          <>
            <Text style={s.hint}>{t("home.to_call_hint")}</Text>
            <View style={{ gap: 10 }}>
              {stats.toCall.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </View>
          </>
        ) : stats ? (
          <Card style={s.done}>
            <Ionicons name="checkmark-done-circle" size={22} color={colors.success} />
            <Text style={s.doneText}>{t("home.all_done")}</Text>
          </Card>
        ) : null}

        {stats && stats.toCall.length && stats.pending > stats.toCall.length ? (
          <Button
            label={t("home.see_all")}
            variant="secondary"
            onPress={() => router.push({ pathname: "/(tabs)/orders", params: { status: "new" } })}
            style={{ marginTop: 12 }}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  kpis: { marginTop: 18 },
  kpiMain: { borderRadius: 18, padding: 16, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  kpiLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "700" },
  kpiValue: { color: "#fff", fontSize: 34, fontWeight: "900", letterSpacing: -1, marginTop: 4 },
  kpiSub: { color: "#5EEAD4", fontSize: 13, fontWeight: "700", marginTop: 2 },
  kpiRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  kpiSmall: { flex: 1, borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  kpiSmallValue: { color: "#fff", fontSize: 24, fontWeight: "900" },
  kpiSmallLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "700", marginTop: 2 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, padding: 14 },
  bannerText: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  bannerAction: { color: colors.purple, fontWeight: "800", fontSize: 14 },
  weekTotal: { fontSize: 15, fontWeight: "800", color: colors.ink, marginBottom: 14 },
  chart: { flexDirection: "row", height: 120, gap: 8 },
  barCol: { flex: 1, alignItems: "center" },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 8 },
  barLabel: { marginTop: 6, fontSize: 12, fontWeight: "700", color: colors.faint },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  done: { flexDirection: "row", alignItems: "center", gap: 10 },
  doneText: { color: colors.text, fontSize: 15, fontWeight: "700" },
});
