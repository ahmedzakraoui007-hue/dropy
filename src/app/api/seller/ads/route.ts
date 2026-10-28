import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const RANGES: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const CONFIRMED = new Set(["confirmed", "preparing", "shipped", "delivered"]);

type Item = { store_product_id: string | null; quantity: number | null; total_price: number | null };
type Row = {
  status: string;
  total_amount: number | null;
  attribution: { platform?: string; campaign?: string | null; ad?: string | null } | null;
  items: Item[] | null;
};

export type AdMetrics = {
  orders: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  deliveredRevenue: number;
  margin: number;
  unknownCost: boolean;
};

type Group = AdMetrics & { name: string; children?: Map<string, Group> };

const empty = (name: string): Group => ({ name, orders: 0, confirmed: 0, delivered: 0, cancelled: 0, deliveredRevenue: 0, margin: 0, unknownCost: false });
const round = (value: number) => Math.round(value * 1000) / 1000;

function add(target: Group, row: Row, margin: number | null) {
  target.orders += 1;
  if (CONFIRMED.has(row.status)) target.confirmed += 1;
  if (row.status === "cancelled") target.cancelled += 1;
  if (row.status === "delivered") {
    target.delivered += 1;
    target.deliveredRevenue = round(target.deliveredRevenue + Number(row.total_amount || 0));
    if (margin == null) target.unknownCost = true;
    else target.margin = round(target.margin + margin);
  }
}

function child(parent: Group, name: string) {
  parent.children ??= new Map();
  let found = parent.children.get(name);
  if (!found) {
    found = empty(name);
    parent.children.set(name, found);
  }
  return found;
}

function serialize(group: Group): Record<string, unknown> {
  const { children, ...metrics } = group;
  return {
    ...metrics,
    ...(children ? { children: [...children.values()].sort((a, b) => b.orders - a.orders).map(serialize) } : {}),
  };
}

export async function GET(request: Request) {
  const auth = await requireUser(["seller", "admin"]);
  if (!auth.ok) return auth.response;

  const days = RANGES[new URL(request.url).searchParams.get("range") || "30d"] || 30;
  const since = new Date(Date.now() - days * 86400000);

  const { data: store } = await auth.supabase
    .from("stores")
    .select("id")
    .eq("vendor_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return NextResponse.json({ error: "store_not_found" }, { status: 404 });

  const { data, error } = await auth.supabase
    .from("store_orders")
    .select("status, total_amount, attribution, items:store_order_items(store_product_id, quantity, total_price)")
    .eq("store_id", store.id)
    .gte("created_at", since.toISOString())
    .limit(5000);
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });
  const rows = (data || []) as Row[];

  const productIds = [...new Set(rows.flatMap((r) => (r.items || []).map((i) => i.store_product_id)).filter((id): id is string => Boolean(id)))];
  const costs = new Map<string, number | null>();
  if (productIds.length) {
    const admin = createAdminClient();
    const { data: products } = await admin.from("store_products").select("id, is_dropship, product_id").in("id", productIds);
    const sourceIds = [...new Set((products || []).map((p) => p.product_id).filter(Boolean))];
    const { data: sources } = sourceIds.length
      ? await admin.from("products").select("id, base_price").in("id", sourceIds)
      : { data: [] as { id: string; base_price: number | null }[] };
    const basePrice = new Map((sources || []).map((s) => [s.id, s.base_price]));
    for (const p of products || []) {
      const base = p.product_id ? basePrice.get(p.product_id) : null;
      costs.set(p.id, p.is_dropship && base != null ? Number(base) : null);
    }
  }

  const marginOf = (row: Row) => {
    let total = 0;
    for (const item of row.items || []) {
      const cost = item.store_product_id ? costs.get(item.store_product_id) : null;
      if (cost == null) return null;
      total += Number(item.total_price || 0) - cost * Number(item.quantity || 0);
    }
    return total;
  };

  const totals = empty("total");
  const platforms = new Map<string, Group>();
  for (const row of rows) {
    const margin = row.status === "delivered" ? marginOf(row) : 0;
    const platform = row.attribution?.platform || "unknown";
    const campaign = row.attribution?.campaign || "";
    const ad = row.attribution?.ad || "";
    add(totals, row, margin);
    let p = platforms.get(platform);
    if (!p) {
      p = empty(platform);
      platforms.set(platform, p);
    }
    add(p, row, margin);
    const c = child(p, campaign);
    add(c, row, margin);
    add(child(c, ad), row, margin);
  }

  return NextResponse.json({
    days,
    totals: serialize(totals),
    platforms: [...platforms.values()].sort((a, b) => b.orders - a.orders).map(serialize),
  });
}
