import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusPill } from "@/components/ui";
import { money, relativeTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Order } from "@/lib/orders";
import { colors } from "@/lib/theme";

export function OrderRow({ order }: { order: Order }) {
  const { t, locale } = useI18n();
  const items = order.items || [];
  const count = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const image = items.find((i) => i.product_image)?.product_image;
  const risky = (order.risk_flags || []).length > 0;
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/orders/[id]", params: { id: order.id } })}
      style={({ pressed }) => [s.row, order.status === "new" && s.rowNew, pressed && { opacity: 0.85 }]}
    >
      <View style={s.thumb}>
        {image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="cube-outline" size={22} color={colors.faint} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.line}>
          <Text style={s.name} numberOfLines={1}>
            {order.customer_name}
          </Text>
          <Text style={s.total}>{money(order.total_amount, locale)}</Text>
        </View>
        <Text style={s.meta} numberOfLines={1}>
          {[order.order_number, order.customer_governorate, t("orders.items", { count })].filter(Boolean).join(" · ")}
        </Text>
        <View style={[s.line, { marginTop: 8 }]}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <StatusPill status={order.status} />
            {risky ? <Ionicons name="warning" size={16} color={colors.danger} /> : null}
          </View>
          <Text style={s.time}>{relativeTime(order.created_at, locale, t)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.line },
  rowNew: { borderColor: "#FCD34D" },
  thumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: colors.bg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  line: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: "800", color: colors.ink },
  total: { fontSize: 15, fontWeight: "900", color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  time: { fontSize: 12, color: colors.faint, fontWeight: "600" },
});
