import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Redirect, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Card, Chip, ChipRow, EmptyState, Loading, useToast } from "@/components/ui";
import { money, phoneDigits, relativeTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { firstImage } from "@/lib/products";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type LeadStatus = "open" | "contacted" | "converted" | "dismissed";

type Lead = {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  customer_governorate: string | null;
  quantity: number | null;
  status: LeadStatus;
  created_at: string;
  product: { name: string; images: unknown; selling_price: number | null } | null;
};

const FILTERS: Exclude<LeadStatus, "dismissed">[] = ["open", "contacted", "converted"];

export default function LeadsScreen() {
  const { t, locale } = useI18n();
  const { ready, session, store, storeIds } = useSession();
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("open");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!storeIds.length) {
      if (ready) setLeads([]);
      return;
    }
    const { data, error } = await supabase
      .from("store_order_leads")
      .select("id, customer_name, customer_phone, customer_governorate, quantity, status, created_at, product:store_products(name, images, selling_price)")
      .in("store_id", storeIds)
      .neq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast(t("leads.load_error"), "error");
    setLeads((data as unknown as Lead[]) || []);
  }, [storeIds.join(","), ready]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (lead: Lead, status: LeadStatus) => {
    const previous = leads;
    setLeads((prev) => (prev || []).flatMap((l) => (l.id !== lead.id ? [l] : status === "dismissed" ? [] : [{ ...l, status }])));
    const { error } = await supabase.from("store_order_leads").update({ status, updated_at: new Date().toISOString() }).eq("id", lead.id);
    if (error) {
      setLeads(previous);
      toast(t("leads.update_error"), "error");
    }
  };

  const contact = (lead: Lead, channel: "call" | "whatsapp") => {
    const digits = phoneDigits(lead.customer_phone);
    if (channel === "call") {
      Linking.openURL(`tel:+${digits}`);
    } else {
      const message = t("leads.whatsapp_message", { name: lead.customer_name || "", store: store?.name || "", product: lead.product?.name || "" });
      Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(message.replace(/\s+/g, " ").trim())}`);
    }
    if (lead.status === "open") setStatus(lead, "contacted");
  };

  const counts = Object.fromEntries(FILTERS.map((f) => [f, (leads || []).filter((l) => l.status === f).length])) as Record<(typeof FILTERS)[number], number>;
  const visible = (leads || []).filter((l) => l.status === filter);

  if (ready && !session) return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t("leads.title") }} />
      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f} label={t(`leads.filter_${f}`)} count={counts[f]} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ChipRow>
      {leads === null ? (
        <Loading />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListHeaderComponent={filter === "open" ? <Text style={s.help}>{t("leads.help")}</Text> : undefined}
          ListEmptyComponent={<EmptyState icon="cart-outline" title={t(`leads.empty_${filter}`)} hint={t("leads.empty_hint")} />}
          renderItem={({ item }) => {
            const image = firstImage(item.product?.images);
            const quantity = Math.max(1, Number(item.quantity || 1));
            return (
              <Card style={{ gap: 12 }}>
                <View style={s.row}>
                  <View style={s.thumb}>{image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="cube-outline" size={20} color={colors.faint} />}</View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.name} numberOfLines={1}>
                      {item.customer_name || item.customer_phone}
                    </Text>
                    <Text style={s.meta} numberOfLines={1}>
                      {[item.product?.name, quantity > 1 ? `×${quantity}` : null].filter(Boolean).join(" ")}
                    </Text>
                    <Text style={s.meta} numberOfLines={1}>
                      {[item.customer_governorate, relativeTime(item.created_at, locale, t)].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  {item.product?.selling_price ? <Text style={s.amount}>{money(Number(item.product.selling_price) * quantity, locale)}</Text> : null}
                </View>
                {item.status !== "converted" ? (
                  <View style={s.actions}>
                    <Action icon="call" label={t("leads.call")} color={colors.ink} onPress={() => contact(item, "call")} />
                    <Action icon="logo-whatsapp" label="WhatsApp" color="#128C7E" onPress={() => contact(item, "whatsapp")} />
                    <Action icon="checkmark-circle" label={t("leads.converted")} color={colors.success} onPress={() => setStatus(item, "converted")} />
                    <Action icon="close-circle" label={t("leads.dismiss")} color={colors.muted} onPress={() => setStatus(item, "dismissed")} />
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

function Action({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.action, pressed && { opacity: 0.6 }]} hitSlop={4}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[s.actionLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  help: { fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "800", color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "900", color: colors.ink },
  actions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  action: { flex: 1, alignItems: "center", gap: 3 },
  actionLabel: { fontSize: 11, fontWeight: "800" },
});
