import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";
import { Chip, ChipRow, EmptyState, Hero, Loading, SearchBox, useToast } from "@/components/ui";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { firstImage, LOW_STOCK, PRODUCT_COLUMNS, totalStock, type Product } from "@/lib/products";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Filter = "all" | "active" | "hidden" | "low";

export default function Products() {
  const { t, locale } = useI18n();
  const { storeIds } = useSession();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!storeIds.length) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("store_products").select(PRODUCT_COLUMNS).in("store_id", storeIds).order("position", { ascending: true }).order("created_at", { ascending: false });
    setProducts((data || []) as Product[]);
    setLoading(false);
  }, [storeIds.join(",")]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = async (product: Product, value: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: value } : p)));
    Haptics.selectionAsync().catch(() => {});
    const { error } = await supabase.from("store_products").update({ is_active: value }).eq("id", product.id);
    if (error) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: !value } : p)));
      toast(t("common.error"), "error");
    }
  };

  const counts = useMemo(() => {
    const low = products.filter((p) => {
      const stock = totalStock(p);
      return stock != null && stock <= LOW_STOCK;
    }).length;
    return { all: products.length, active: products.filter((p) => p.is_active).length, hidden: products.filter((p) => !p.is_active).length, low };
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filter === "active") return p.is_active;
      if (filter === "hidden") return !p.is_active;
      if (filter === "low") {
        const stock = totalStock(p);
        return stock != null && stock <= LOW_STOCK;
      }
      return true;
    });
  }, [products, filter, search]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("products.filter_all") },
    { key: "active", label: t("products.filter_active") },
    { key: "hidden", label: t("products.filter_hidden") },
    { key: "low", label: t("products.filter_low") },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Hero title={t("products.title")}>
        <SearchBox value={search} onChangeText={setSearch} placeholder={t("products.search")} />
      </Hero>
      <View>
        <ChipRow>
          {filters.map((f) => (
            <Chip key={f.key} label={f.label} count={counts[f.key]} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ChipRow>
      </View>
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10, flexGrow: 1 }}
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
          ListEmptyComponent={
            search ? <EmptyState icon="search" title={t("common.empty_search")} /> : <EmptyState icon="pricetags-outline" title={t("products.empty")} hint={t("products.empty_hint")} />
          }
          renderItem={({ item }) => {
            const image = firstImage(item.images);
            const stock = totalStock(item);
            const low = stock != null && stock <= LOW_STOCK;
            return (
              <Pressable onPress={() => router.push({ pathname: "/products/[id]", params: { id: item.id } })} style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}>
                <View style={[s.thumb, !item.is_active && { opacity: 0.5 }]}>
                  {image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="image-outline" size={22} color={colors.faint} />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[s.name, !item.is_active && { color: colors.muted }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={s.priceRow}>
                    <Text style={s.price}>{money(item.selling_price, locale)}</Text>
                    {item.compare_at_price && Number(item.compare_at_price) > Number(item.selling_price) ? <Text style={s.compare}>{money(item.compare_at_price, locale)}</Text> : null}
                  </View>
                  <View style={s.tags}>
                    <Text style={[s.stock, low && { color: stock === 0 ? colors.danger : colors.warning }]}>
                      {stock == null ? t("products.unlimited") : stock === 0 ? t("products.out") : t("products.stock", { count: stock })}
                    </Text>
                    {item.is_dropship ? <Text style={s.tag}>{t("products.dropship")}</Text> : null}
                  </View>
                </View>
                <Switch
                  value={Boolean(item.is_active)}
                  onValueChange={(v) => toggle(item, v)}
                  trackColor={{ true: colors.purple, false: colors.line }}
                  thumbColor="#fff"
                />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.line },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.bg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "800", color: colors.ink },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 },
  price: { fontSize: 15, fontWeight: "900", color: colors.ink },
  compare: { fontSize: 13, color: colors.faint, textDecorationLine: "line-through" },
  tags: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  stock: { fontSize: 12, fontWeight: "700", color: colors.muted },
  tag: { fontSize: 11, fontWeight: "800", color: colors.teal, backgroundColor: colors.tealSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
});
