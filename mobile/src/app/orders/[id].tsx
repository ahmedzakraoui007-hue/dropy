import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReputationCard } from "@/components/Reputation";
import { Button, Card, EmptyState, Loading, StatusPill, useToast } from "@/components/ui";
import { dateTime, money, phoneDigits } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { CANCEL_REASONS, variantText, type Order } from "@/lib/orders";
import { useSession } from "@/lib/session";
import { api, supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

const DETAIL_COLUMNS =
  "id, order_number, store_id, customer_name, customer_phone, customer_address, customer_governorate, customer_delegation, status, subtotal, discount_amount, shipping_cost, total_amount, tracking_number, shipping_company, notes, risk_flags, created_at, items:store_order_items(id, store_product_id, product_name, product_image, variant_info, quantity, unit_price, total_price)";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { store } = useSession();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("store_orders").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
    setOrder((data as unknown as Order) || null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: "confirm" | "cancel", reason?: string) => {
    setBusy(action);
    try {
      await api(`/api/seller/orders/${id}`, { method: "POST", body: { action, reason } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast(action === "confirm" ? t("order.confirmed_toast") : t("order.cancelled_toast"));
      setCancelOpen(false);
      await load();
    } catch (error) {
      toast(error instanceof Error && error.message ? error.message : t("common.error"), "error");
    } finally {
      setBusy(null);
    }
  };

  const confirm = () =>
    Alert.alert(t("order.confirm_title"), t("order.confirm_body"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("order.confirm"), onPress: () => act("confirm") },
    ]);

  if (loading) return <Loading />;
  if (!order) return <EmptyState icon="alert-circle-outline" title={t("common.error")} action={t("common.retry")} onAction={load} />;

  const items = order.items || [];
  const phone = phoneDigits(order.customer_phone);
  const address = [order.customer_address, order.customer_delegation, order.customer_governorate].filter(Boolean).join(", ");
  const whatsappText = t("order.whatsapp_message", {
    name: order.customer_name.split(" ")[0],
    store: store?.name || "",
    number: order.order_number,
    total: money(order.total_amount, locale),
  });
  const canCancel = ["new", "confirmed", "preparing"].includes(order.status);
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_cost || 0);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t("order.title", { number: order.order_number }) }} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 + insets.bottom, gap: 12 }}
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
      >
        <View style={s.head}>
          <StatusPill status={order.status} />
          <Text style={s.placed}>{t("order.placed", { date: dateTime(order.created_at, locale) })}</Text>
        </View>

        {(order.risk_flags || []).length ? (
          <Card style={[s.risk]}>
            <Ionicons name="warning" size={18} color={colors.danger} />
            <Text style={s.riskText}>{t("order.risk")}</Text>
          </Card>
        ) : null}

        <ReputationCard orderId={order.id} />

        <Card>
          <Text style={s.cardLabel}>{t("order.customer")}</Text>
          <Text style={s.customer}>{order.customer_name}</Text>
          <Text style={s.phone}>{order.customer_phone}</Text>
          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync(address);
              toast(t("order.copied"));
            }}
            style={s.address}
          >
            <Ionicons name="location-outline" size={18} color={colors.muted} />
            <Text style={s.addressText}>{address}</Text>
            <Ionicons name="copy-outline" size={16} color={colors.faint} />
          </Pressable>
          <View style={s.contactRow}>
            <Pressable style={[s.contact, { backgroundColor: colors.purpleSoft }]} onPress={() => Linking.openURL(`tel:+${phone}`)}>
              <Ionicons name="call" size={18} color={colors.purple} />
              <Text style={[s.contactText, { color: colors.purple }]}>{t("order.call")}</Text>
            </Pressable>
            <Pressable style={[s.contact, { backgroundColor: "#DCFCE7" }]} onPress={() => Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`)}>
              <Ionicons name="logo-whatsapp" size={18} color="#15803D" />
              <Text style={[s.contactText, { color: "#15803D" }]}>{t("order.whatsapp")}</Text>
            </Pressable>
          </View>
        </Card>

        <Card>
          <Text style={s.cardLabel}>{t("order.products")}</Text>
          {items.map((item, index) => (
            <View key={item.id} style={[s.item, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
              <View style={s.itemThumb}>
                {item.product_image ? <Image source={item.product_image} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="cube-outline" size={20} color={colors.faint} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName} numberOfLines={2}>
                  {item.product_name}
                </Text>
                {variantText(item.variant_info) ? <Text style={s.itemVariant}>{variantText(item.variant_info)}</Text> : null}
                <Text style={s.itemQty}>
                  {item.quantity} × {money(item.unit_price, locale)}
                </Text>
              </View>
              <Text style={s.itemTotal}>{money(item.total_price, locale)}</Text>
            </View>
          ))}
          <View style={s.totals}>
            <Line label={t("order.subtotal")} value={money(order.subtotal, locale)} />
            {discount > 0 ? <Line label={t("order.discount")} value={`− ${money(discount, locale)}`} /> : null}
            <Line label={t("order.shipping")} value={shipping > 0 ? money(shipping, locale) : t("order.free")} />
            <Line label={t("order.total")} value={money(order.total_amount, locale)} strong />
          </View>
        </Card>

        {order.notes ? (
          <Card>
            <Text style={s.cardLabel}>{t("order.note")}</Text>
            <Text style={s.note}>{order.notes}</Text>
          </Card>
        ) : null}

        {order.tracking_number ? (
          <Card>
            <Text style={s.cardLabel}>{t("order.tracking")}</Text>
            <Text style={s.note}>{[order.shipping_company, order.tracking_number].filter(Boolean).join(" · ")}</Text>
          </Card>
        ) : null}
      </ScrollView>

      {order.status === "new" || canCancel ? (
        <View style={[s.actions, { paddingBottom: insets.bottom + 12 }]}>
          {order.status === "new" ? (
            <>
              <Text style={s.actionHint}>{t("order.confirm_hint")}</Text>
              <Button label={t("order.confirm")} icon="checkmark-circle" onPress={confirm} loading={busy === "confirm"} disabled={busy !== null} />
            </>
          ) : null}
          {canCancel ? <Button label={t("order.cancel")} variant="ghost" onPress={() => setCancelOpen(true)} disabled={busy !== null} style={{ height: 44 }} /> : null}
        </View>
      ) : null}

      <Modal visible={cancelOpen} transparent animationType="slide" onRequestClose={() => setCancelOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => !busy && setCancelOpen(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.grabber} />
          <Text style={s.sheetTitle}>{t("order.cancel_title")}</Text>
          {CANCEL_REASONS.map((reason) => (
            <Pressable key={reason} style={({ pressed }) => [s.reason, pressed && { backgroundColor: colors.bg }]} onPress={() => act("cancel", reason)} disabled={busy !== null}>
              <Text style={s.reasonText}>{t(`order.reasons.${reason}`)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            </Pressable>
          ))}
          <Button label={t("common.close")} variant="secondary" onPress={() => setCancelOpen(false)} loading={busy === "cancel"} style={{ marginTop: 12 }} />
        </View>
      </Modal>
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.line}>
      <Text style={[s.lineLabel, strong && s.lineStrong]}>{label}</Text>
      <Text style={[s.lineValue, strong && s.lineStrong]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  placed: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  risk: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: colors.dangerSoft, borderColor: "#FECDD3" },
  riskText: { flex: 1, color: "#9F1239", fontWeight: "700", fontSize: 14 },
  cardLabel: { fontSize: 12, fontWeight: "800", color: colors.faint, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  customer: { fontSize: 19, fontWeight: "900", color: colors.ink },
  phone: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 2 },
  address: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 12, padding: 12, backgroundColor: colors.bg, borderRadius: 12 },
  addressText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  contactRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  contact: { flex: 1, height: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  contactText: { fontSize: 15, fontWeight: "800" },
  item: { flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "center" },
  itemThumb: { width: 54, height: 54, borderRadius: 12, backgroundColor: colors.bg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 14, fontWeight: "800", color: colors.ink },
  itemVariant: { fontSize: 13, color: colors.purple, fontWeight: "700", marginTop: 2 },
  itemQty: { fontSize: 13, color: colors.muted, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: "900", color: colors.ink },
  totals: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 4, gap: 6 },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineLabel: { fontSize: 14, color: colors.muted },
  lineValue: { fontSize: 14, color: colors.text, fontWeight: "700" },
  lineStrong: { fontSize: 17, color: colors.ink, fontWeight: "900" },
  note: { fontSize: 15, color: colors.text, lineHeight: 21 },
  actions: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  actionHint: { fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(7,10,31,0.5)" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: "center", marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: "900", color: colors.ink, marginBottom: 8 },
  reason: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 8, borderRadius: 12 },
  reasonText: { fontSize: 16, fontWeight: "700", color: colors.text },
});
