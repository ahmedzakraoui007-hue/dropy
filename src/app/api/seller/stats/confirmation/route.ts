import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

const RANGES: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const CONFIRMED = new Set(["confirmed", "preparing", "shipped", "delivered"]);

type Row = {
  status: string;
  cancel_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  total_amount: number | null;
  customer_governorate: string | null;
  risk_flags: string[] | null;
  items: { product_name: string | null; quantity: number | null }[] | null;
};

type Bucket = { received: number; confirmed: number; cancelled: number; delivered: number };
const bucket = (): Bucket => ({ received: 0, confirmed: 0, cancelled: 0, delivered: 0 });

const tunisDay = (value: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

function count(target: Bucket, row: Row) {
  target.received += 1;
  if (CONFIRMED.has(row.status)) target.confirmed += 1;
  if (row.status === "cancelled") target.cancelled += 1;
  if (row.status === "delivered") target.delivered += 1;
}

const rate = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

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

  const [{ data, error }, { data: leads }] = await Promise.all([
    auth.supabase
      .from("store_orders")
      .select("status, cancel_reason, created_at, confirmed_at, total_amount, customer_governorate, risk_flags, items:store_order_items(product_name, quantity)")
      .eq("store_id", store.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .limit(5000),
    auth.supabase.from("store_order_leads").select("status").eq("store_id", store.id).gte("created_at", since.toISOString()).limit(5000),
  ]);
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });

  const rows = (data || []) as unknown as Row[];
  const totals = bucket();
  let pending = 0;
  let suspicious = 0;
  let confirmedValue = 0;
  let deliveredValue = 0;
  const confirmHours: number[] = [];
  const reasons: Record<string, number> = {};
  const byDay = new Map<string, Bucket>();
  const byProduct = new Map<string, Bucket>();
  const byGovernorate = new Map<string, Bucket>();

  for (let i = 0; i < days; i++) byDay.set(tunisDay(new Date(since.getTime() + (i + 1) * 86400000).toISOString()), bucket());

  for (const row of rows) {
    count(totals, row);
    if (row.status === "new") pending += 1;
    if ((row.risk_flags || []).length) suspicious += 1;
    if (CONFIRMED.has(row.status)) confirmedValue += Number(row.total_amount) || 0;
    if (row.status === "delivered") deliveredValue += Number(row.total_amount) || 0;
    if (row.status === "cancelled") {
      const reason = row.cancel_reason || "other";
      reasons[reason] = (reasons[reason] || 0) + 1;
    }
    if (row.confirmed_at) {
      const hours = (new Date(row.confirmed_at).getTime() - new Date(row.created_at).getTime()) / 3600000;
      if (hours >= 0 && hours < 24 * 30) confirmHours.push(hours);
    }
    const day = tunisDay(row.created_at);
    if (!byDay.has(day)) byDay.set(day, bucket());
    count(byDay.get(day)!, row);
    const governorate = row.customer_governorate || "—";
    if (!byGovernorate.has(governorate)) byGovernorate.set(governorate, bucket());
    count(byGovernorate.get(governorate)!, row);
    for (const name of new Set((row.items || []).map((item) => item.product_name || "—"))) {
      if (!byProduct.has(name)) byProduct.set(name, bucket());
      count(byProduct.get(name)!, row);
    }
  }

  const decided = totals.confirmed + totals.cancelled;
  const sortedHours = [...confirmHours].sort((a, b) => a - b);
  const table = (map: Map<string, Bucket>) =>
    [...map.entries()]
      .map(([name, b]) => ({ name, ...b, confirmationRate: rate(b.confirmed, b.confirmed + b.cancelled), deliveryRate: rate(b.delivered, b.confirmed) }))
      .sort((a, b) => b.received - a.received)
      .slice(0, 15);

  return NextResponse.json({
    days,
    totals: { ...totals, pending, suspicious, confirmedValue, deliveredValue },
    rates: {
      confirmation: rate(totals.confirmed, decided),
      cancellation: rate(totals.cancelled, decided),
      delivery: rate(totals.delivered, totals.confirmed),
    },
    medianConfirmHours: sortedHours.length ? Math.round(sortedHours[Math.floor(sortedHours.length / 2)] * 10) / 10 : null,
    reasons: Object.entries(reasons).map(([reason, total]) => ({ reason, total })).sort((a, b) => b.total - a.total),
    byDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, b]) => ({ date, ...b })),
    byProduct: table(byProduct),
    byGovernorate: table(byGovernorate),
    leads: {
      total: (leads || []).length,
      recovered: (leads || []).filter((l) => l.status === "converted").length,
    },
  });
}
