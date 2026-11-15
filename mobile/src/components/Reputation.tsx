import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Level = "new" | "trusted" | "watch" | "risky";
type Reputation = { level: Level; orders: number; delivered: number; refused: number; unreachable: number; fake: number };

const TONES: Record<Level, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  new: { bg: "#F3F4F6", fg: colors.muted, icon: "person-add-outline" },
  trusted: { bg: colors.successSoft, fg: colors.success, icon: "shield-checkmark" },
  watch: { bg: colors.warningSoft, fg: colors.warning, icon: "help-circle" },
  risky: { bg: colors.dangerSoft, fg: colors.danger, icon: "alert-circle" },
};

export function ReputationCard({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<Reputation | null>(null);

  useEffect(() => {
    let active = true;
    api<Reputation>(`/api/seller/orders/${orderId}/reputation`)
      .then((r) => active && setData(r))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [orderId]);

  if (!data) return null;
  const tone = TONES[data.level];
  const stats: [string, number][] = [
    ["delivered", data.delivered],
    ["refused", data.refused],
    ["unreachable", data.unreachable],
    ["fake", data.fake],
  ];

  return (
    <Card style={{ gap: 12 }}>
      <View style={s.head}>
        <Text style={s.label}>{t("reputation.title")}</Text>
        <View style={[s.badge, { backgroundColor: tone.bg }]}>
          <Ionicons name={tone.icon} size={14} color={tone.fg} />
          <Text style={[s.badgeText, { color: tone.fg }]}>{t(`reputation.level_${data.level}`)}</Text>
        </View>
      </View>
      {data.orders > 0 ? (
        <View style={s.stats}>
          {stats.map(([key, value]) => (
            <View key={key} style={s.stat}>
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statLabel} numberOfLines={1}>
                {t(`reputation.${key}`)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={s.hint}>{t(`reputation.hint_${data.level}`)}</Text>
    </Card>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { fontSize: 12, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "900" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, backgroundColor: colors.bg, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.ink },
  statLabel: { fontSize: 11, fontWeight: "700", color: colors.muted, marginTop: 2 },
  hint: { fontSize: 13, color: colors.text, lineHeight: 18 },
});
