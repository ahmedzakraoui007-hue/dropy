import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { registerForPush } from "@/lib/push";
import { isAllowedSeller, useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

function usePendingCount(storeIds: string[]) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!storeIds.length) return;
    const load = () =>
      supabase
        .from("store_orders")
        .select("id", { count: "exact", head: true })
        .in("store_id", storeIds)
        .eq("status", "new")
        .then(({ count: c }) => setCount(c || 0));
    load();
    const channel = supabase
      .channel(`pending-${storeIds.join(",")}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "store_orders", filter: `store_id=in.(${storeIds.join(",")})` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeIds.join(",")]);
  return count;
}

export default function TabsLayout() {
  const { t } = useI18n();
  const { ready, session, profile, storeIds } = useSession();
  const pending = usePendingCount(storeIds);

  useEffect(() => {
    if (session && isAllowedSeller(profile)) registerForPush(false);
  }, [session?.user.id, profile?.status]);

  if (!ready) return <Loading />;
  if (!session || !isAllowedSeller(profile)) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: { borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home"), tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color as string} /> }} />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("tabs.orders"),
          tabBarBadge: pending ? (pending > 99 ? "99+" : pending) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen name="products" options={{ title: t("tabs.products"), tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" size={size} color={color as string} /> }} />
      <Tabs.Screen name="store" options={{ title: t("tabs.store"), tabBarIcon: ({ color, size }) => <Ionicons name="storefront" size={size} color={color as string} /> }} />
    </Tabs>
  );
}
