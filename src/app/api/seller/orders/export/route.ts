import { requireUser } from "@/lib/api-auth";

const STATUS_LABELS: Record<string, string> = {
  new: "À confirmer",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const CANCEL_LABELS: Record<string, string> = {
  unreachable: "Client injoignable",
  customer_cancelled: "Le client a annulé",
  fake_order: "Fausse commande",
  out_of_stock: "Rupture de stock",
  other: "Autre raison",
};

function tunisDate(value: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Tunis",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(value))
      .map((p) => [p.type, p.value])
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

const COLUMNS = [
  "N° commande",
  "Date",
  "Statut",
  "Client",
  "Téléphone",
  "Gouvernorat",
  "Adresse",
  "Produits",
  "Quantité",
  "Sous-total",
  "Livraison",
  "Remise",
  "Total",
  "Paiement",
  "N° de suivi",
  "Motif d'annulation",
];

function cell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const money = (value: unknown) => (Number(value) || 0).toFixed(3).replace(".", ",");

export async function GET(request: Request) {
  const auth = await requireUser(["seller", "admin"]);
  if (!auth.ok) return auth.response;

  const { data: store } = await auth.supabase
    .from("stores")
    .select("id, slug")
    .eq("vendor_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return new Response("Boutique introuvable", { status: 404 });

  const params = new URL(request.url).searchParams;
  let query = auth.supabase
    .from("store_orders")
    .select(
      "order_number, created_at, status, customer_name, customer_phone, customer_governorate, customer_address, subtotal, shipping_cost, discount_amount, total_amount, payment_method, payment_status, tracking_number, cancel_reason, items:store_order_items(product_name, quantity, variant_info)"
    )
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(5000);

  const status = params.get("status");
  if (status && status !== "all") query = query.eq("status", status);
  const governorate = params.get("governorate");
  if (governorate) query = query.eq("customer_governorate", governorate);
  const from = params.get("from");
  if (from) query = query.gte("created_at", from);
  const to = params.get("to");
  if (to) query = query.lte("created_at", to);
  const search = params.get("search")?.replace(/[,%()]/g, " ").trim();
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  }

  const { data: orders, error } = await query;
  if (error) return new Response("Export impossible", { status: 500 });

  const rows = (orders || []).map((o: any) => {
    const items = (o.items || []) as { product_name: string; quantity: number; variant_info: Record<string, string> | null }[];
    const products = items
      .map((i) => {
        const variant = i.variant_info ? Object.values(i.variant_info).filter(Boolean).join(" / ") : "";
        return `${i.product_name}${variant ? ` (${variant})` : ""} x${i.quantity}`;
      })
      .join(" + ");
    return [
      o.order_number,
      tunisDate(o.created_at),
      STATUS_LABELS[o.status] || o.status,
      o.customer_name,
      o.customer_phone,
      o.customer_governorate,
      o.customer_address,
      products,
      items.reduce((sum, i) => sum + Number(i.quantity || 0), 0),
      money(o.subtotal),
      money(o.shipping_cost),
      money(o.discount_amount),
      money(o.total_amount),
      o.payment_method === "cod" ? `À la livraison${o.payment_status === "paid" ? " (encaissé)" : ""}` : o.payment_method,
      o.tracking_number,
      o.cancel_reason ? CANCEL_LABELS[o.cancel_reason] || o.cancel_reason : "",
    ];
  });

  const csv = "\uFEFF" + [COLUMNS, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-${store.slug}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
