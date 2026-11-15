import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, EmptyState, Field, Loading, useToast } from "@/components/ui";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { firstImage, PRODUCT_COLUMNS, type Product } from "@/lib/products";
import { useSession } from "@/lib/session";
import { storeLink, supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Detail = Product & { source_product?: { base_price: number | null } | null };

const toInput = (value: number | null | undefined) => (value == null ? "" : String(Number(value)));
const parse = (value: string) => {
  const cleaned = value.replace(",", ".").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

export default function ProductEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { store } = useSession();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(true);
  const [price, setPrice] = useState("");
  const [compare, setCompare] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("store_products").select(`${PRODUCT_COLUMNS}, source_product:products(base_price)`).eq("id", id).maybeSingle();
    const p = (data as unknown as Detail) || null;
    setProduct(p);
    if (p) {
      setActive(Boolean(p.is_active));
      setPrice(toInput(p.selling_price));
      setCompare(toInput(p.compare_at_price));
      setStock(toInput(p.stock_quantity));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;
  if (!product) return <EmptyState icon="alert-circle-outline" title={t("common.error")} action={t("common.retry")} onAction={load} />;

  const cost = product.source_product?.base_price != null ? Number(product.source_product.base_price) : null;
  const variantStock = Boolean(product.has_variants && Array.isArray(product.variants) && product.variants.length);
  const stockEditable = !product.is_dropship && !variantStock;
  const image = firstImage(product.images);

  const save = async () => {
    setError("");
    const nextPrice = parse(price);
    const nextCompare = parse(compare);
    const nextStock = parse(stock);
    if (nextPrice == null || Number.isNaN(nextPrice) || nextPrice <= 0 || (cost != null && nextPrice < cost)) {
      setError(t("product.invalid_price"));
      return;
    }
    if (nextCompare != null && (Number.isNaN(nextCompare) || nextCompare <= nextPrice)) {
      setError(t("product.invalid_compare"));
      return;
    }
    const update: Record<string, unknown> = { is_active: active, selling_price: nextPrice, compare_at_price: nextCompare };
    if (stockEditable) {
      if (nextStock != null && (Number.isNaN(nextStock) || nextStock < 0)) {
        setError(t("product.stock_hint"));
        return;
      }
      update.stock_quantity = nextStock == null ? null : Math.floor(nextStock);
    }
    setSaving(true);
    const { error: saveError } = await supabase.from("store_products").update(update).eq("id", product.id);
    setSaving(false);
    if (saveError) {
      toast(t("common.error"), "error");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast(t("product.saved"));
    load();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: t("product.title") }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 + insets.bottom, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Card style={s.head}>
          <View style={s.thumb}>{image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="image-outline" size={26} color={colors.faint} />}</View>
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={3}>
              {product.name}
            </Text>
            {cost != null ? <Text style={s.cost}>{`${money(cost, locale)} → ${money(parse(price) || 0, locale)}`}</Text> : null}
          </View>
        </Card>

        <Card style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>{t("product.visible")}</Text>
            <Text style={s.switchHint}>{t("product.visible_hint")}</Text>
          </View>
          <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.purple, false: colors.line }} thumbColor="#fff" />
        </Card>

        <Card>
          <Field label={t("product.price")} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <Field label={t("product.compare")} hint={t("product.compare_hint")} value={compare} onChangeText={setCompare} keyboardType="decimal-pad" />
          {stockEditable ? (
            <Field label={t("product.stock")} hint={t("product.stock_hint")} value={stock} onChangeText={setStock} keyboardType="number-pad" />
          ) : (
            <View style={s.info}>
              <Ionicons name="information-circle" size={18} color={colors.muted} />
              <Text style={s.infoText}>{product.is_dropship ? t("product.dropship_hint") : t("product.variants_hint")}</Text>
            </View>
          )}
          {error ? <Text style={s.error}>{error}</Text> : null}
        </Card>

        {store && product.is_active ? (
          <Button label={t("product.view")} icon="open-outline" variant="secondary" onPress={() => Linking.openURL(`${storeLink(store)}/p/${product.id}`)} />
        ) : null}
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label={saving ? t("common.saving") : t("common.save")} onPress={save} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", gap: 14, alignItems: "center" },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: colors.bg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "900", color: colors.ink },
  cost: { fontSize: 13, color: colors.teal, fontWeight: "800", marginTop: 6 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchLabel: { fontSize: 15, fontWeight: "800", color: colors.ink },
  switchHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  info: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: colors.bg, padding: 12, borderRadius: 12 },
  infoText: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 19 },
  error: { color: colors.danger, fontSize: 14, fontWeight: "700", marginTop: 8 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 16, paddingTop: 12 },
});
