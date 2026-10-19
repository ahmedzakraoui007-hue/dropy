import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBriefForSeller, notify } from "@/lib/content-escrow";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const { id: briefId } = await params;
  const { notes } = await request.json().catch(() => ({}));
  const message = typeof notes === "string" ? notes.trim() : "";
  if (message.length < 5) {
    return NextResponse.json({ error: "Expliquez les retouches souhaitées" }, { status: 400 });
  }

  const loaded = await loadBriefForSeller(briefId, auth.user.id);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { brief } = loaded;
  if (brief.status !== "delivered" || brief.is_disputed) {
    return NextResponse.json({ error: "Aucune livraison à réviser" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: delivery } = await admin
    .from("content_deliveries")
    .select("id, revision_count")
    .eq("brief_id", briefId)
    .order("delivered_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!delivery) return NextResponse.json({ error: "Aucune livraison à réviser" }, { status: 400 });

  await admin
    .from("content_deliveries")
    .update({ status: "revision_requested", revision_count: (delivery.revision_count || 0) + 1 })
    .eq("id", delivery.id);
  await admin.from("content_briefs").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", briefId);

  await notify(
    brief.selected_creator_id,
    "✏️ Retouches demandées",
    `Le vendeur demande des retouches pour « ${brief.title} » : ${message.slice(0, 300)}`,
    `/creator/missions/${briefId}`
  );

  return NextResponse.json({ success: true });
}
