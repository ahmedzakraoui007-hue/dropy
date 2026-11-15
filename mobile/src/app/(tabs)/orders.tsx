import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { OrderRow } from "@/components/OrderRow";
import { Chip, ChipRow, EmptyState, Hero, Loading, SearchBox } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { ORDER_LIST_COLUMNS, ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/orders";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

type Filter = OrderStatus | "all";
const PAGE = 30;

export default function Orders() {
  const { t } = useI18n();
  const { storeIds } = useSession();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const loadingMore = useRef(false);

  useEffect(() => {
    if (params.status && (params.status === "all" || ORDER_STATUSES.includes(params.status as OrderStatus))) setFilter(params.status as Filter);
  }, [params.status]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  const fetchPage = useCallback(
    async (offset: number) => {
      if (!storeIds.length) return [];
      let q = supabase.from("store_orders").select(ORDER_LIST_COLUMNS).in("store_id", storeIds).order("created_at", { ascending: false }).range(offset, offset + PAGE - 1);
      if (filter !== "all") q = q.eq("status", filter);
      if (query) {
        const safe = query.replace(/[%,()]/g, " ");
        q = q.or(`order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`);
      }
      const { data } = await q;
      return (data || []) as unknown as Order[];
    },
    [storeIds.join(","), filter, query]
  );

  const loadCounts = useCallback(async () => {
    if (!storeIds.length) return;
    const { data } = await supabase.from("store_orders").select("status").in("store_id", storeIds);
    const next: Record<string, number> = { all: data?.length || 0 };
    (data || []).forEach((o) => (next[o.status] = (next[o.status] || 0) + 1));
    setCounts(next);
  }, [storeIds.join(",")]);

  const reload = useCallback(async () => {
    const [rows] = await Promise.all([fetchPage(0), loadCounts()]);
    setOrders(rows);
    setHasMore(rows.length === PAGE);
    setLoading(false);
  }, [fetchPage, loadCounts]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    if (!storeIds.length) return;
    const channel = supabase
      .channel(`orders-list-${storeIds.join(",")}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "store_orders", filter: `store_id=in.(${storeIds.join(",")})` }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeIds.join(","), reload]);

  const loadMore = async () => {
    if (!hasMore || loadingMore.current) return;
    loadingMore.current = true;
    const rows = await fetchPage(orders.length);
    setOrders((prev) => [...prev, ...rows.filter((r) => !prev.some((p) => p.id === r.id))]);
    setHasMore(rows.length === PAGE);
    loadingMore.current = false;
  };

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Hero title={t("orders.title")}>
        <SearchBox value={search} onChangeText={setSearch} placeholder={t("orders.search")} />
      </Hero>
      <View>
        <ChipRow>
          {(["all", ...ORDER_STATUSES] as Filter[]).map((status) => (
            <Chip key={status} label={t(`orders.status.${status}`)} count={counts[status] || 0} active={filter === status} onPress={() => setFilter(status)} />
          ))}
        </ChipRow>
      </View>
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => <OrderRow order={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            query ? <EmptyState icon="search" title={t("common.empty_search")} /> : <EmptyState icon="receipt-outline" title={t("orders.empty")} hint={t("orders.empty_hint")} />
          }
        />
      )}
    </View>
  );
}
