import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/orders";

export type CockpitOrder = Pick<Order, "id" | "order_number" | "customer_name" | "customer_phone" | "total_amount" | "status" | "created_at">;

export type CockpitStore = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean | null;
  custom_domain: string | null;
  custom_domain_status: string | null;
};

type TodoStatus = Extract<OrderStatus, "new" | "confirmed" | "preparing" | "shipped">;

const TODO_STATUSES: TodoStatus[] = ["new", "confirmed", "preparing", "shipped"];
const EMPTY_TODO: Record<TodoStatus, number> = { new: 0, confirmed: 0, preparing: 0, shipped: 0 };

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - i));
    return day;
  });
}

export function useSellerCockpit(sellerId: string) {
  const [store, setStore] = useState<CockpitStore | null>(null);
  const [todo, setTodo] = useState(EMPTY_TODO);
  const [recent, setRecent] = useState<CockpitOrder[]>([]);
  const [week, setWeek] = useState<{ date: Date; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!sellerId) return;
    const supabase = createClient();
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id, name, slug, logo_url, is_active, custom_domain, custom_domain_status")
        .eq("vendor_id", sellerId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setStore(storeData);
      if (!storeData) return;

      const days = lastSevenDays();
      const [open, latest, lastWeek] = await Promise.all([
        supabase.from("store_orders").select("status").eq("store_id", storeData.id).in("status", TODO_STATUSES),
        supabase
          .from("store_orders")
          .select("id, order_number, customer_name, customer_phone, total_amount, status, created_at")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("store_orders").select("created_at, status").eq("store_id", storeData.id).gte("created_at", days[0].toISOString()),
      ]);

      const counts = { ...EMPTY_TODO };
      (open.data || []).forEach((order) => {
        counts[order.status as TodoStatus] += 1;
      });
      setTodo(counts);
      setRecent((latest.data || []) as CockpitOrder[]);
      setWeek(
        days.map((date) => ({
          date,
          count: (lastWeek.data || []).filter((order) => order.status !== "cancelled" && new Date(order.created_at).toDateString() === date.toDateString()).length,
        }))
      );
    } catch (error) {
      console.error("Error fetching seller cockpit:", error);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { store, todo, recent, week, loading, refetch };
}
