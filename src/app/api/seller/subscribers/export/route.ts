import { requireUser } from "@/lib/api-auth";

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

function cell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function GET() {
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

  const { data, error } = await auth.supabase
    .from("store_subscribers")
    .select("email, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(20000);
  if (error) return new Response("Export impossible", { status: 500 });

  const rows = [["E-mail", "Date d'inscription"], ...(data || []).map((s) => [s.email, tunisDate(s.created_at)])];
  const csv = "﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonnes-${store.slug}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
