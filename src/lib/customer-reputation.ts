import type { SupabaseClient } from "@supabase/supabase-js";
import { phoneKey } from "@/lib/order-protection";

export type ReputationLevel = "new" | "trusted" | "watch" | "risky";

export type CustomerReputation = {
  level: ReputationLevel;
  orders: number;
  delivered: number;
  refused: number;
  unreachable: number;
  fake: number;
  stores: number;
};

export function phoneVariants(phone: unknown) {
  const key = phoneKey(phone);
  if (key.length < 8) return [];
  return [...new Set([key, `216${key}`, `+216${key}`, `00216${key}`, String(phone ?? "").trim()])].filter(Boolean);
}

export function reputationLevel(r: Omit<CustomerReputation, "level">): ReputationLevel {
  const bad = r.refused + r.unreachable;
  if (r.fake > 0 || (bad >= 2 && bad > r.delivered)) return "risky";
  if (bad > 0 && bad >= r.delivered) return "watch";
  if (r.delivered > 0) return "trusted";
  return "new";
}

export async function customerReputation(admin: SupabaseClient, phone: unknown, excludeOrderId?: string): Promise<CustomerReputation> {
  const variants = phoneVariants(phone);
  const empty = { orders: 0, delivered: 0, refused: 0, unreachable: 0, fake: 0, stores: 0 };
  if (!variants.length) return { ...empty, level: "new" };
  let query = admin
    .from("store_orders")
    .select("id, store_id, status, cancel_reason, shipped_at")
    .in("customer_phone", variants)
    .order("created_at", { ascending: false })
    .limit(200);
  if (excludeOrderId) query = query.neq("id", excludeOrderId);
  const { data } = await query;
  const rows = data || [];
  const counts = {
    orders: rows.length,
    delivered: rows.filter((o) => o.status === "delivered").length,
    refused: rows.filter((o) => o.status === "cancelled" && o.shipped_at && o.cancel_reason !== "fake_order").length,
    unreachable: rows.filter((o) => o.status === "cancelled" && !o.shipped_at && o.cancel_reason === "unreachable").length,
    fake: rows.filter((o) => o.cancel_reason === "fake_order").length,
    stores: new Set(rows.map((o) => o.store_id)).size,
  };
  return { ...counts, level: reputationLevel(counts) };
}
