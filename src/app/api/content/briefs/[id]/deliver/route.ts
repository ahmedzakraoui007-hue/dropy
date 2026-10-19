import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/content-escrow";

interface DeliveredFile {
  url: string;
  filename?: string;
  type?: string;
  size?: number;
  path?: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["creator"]);
  if (!auth.ok) return auth.response;
  const { id: briefId } = await params;
  const body = await request.json().catch(() => ({}));

  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/content-deliverables/${briefId}/${auth.user.id}/`;
  const files: DeliveredFile[] = Array.isArray(body.files)
    ? body.files
        .filter((f: DeliveredFile) => typeof f?.url === "string" && f.url.startsWith(prefix))
        .slice(0, 20)
        .map((f: DeliveredFile) => ({
          url: f.url,
          filename: String(f.filename || "").slice(0, 200),
          type: String(f.type || "").slice(0, 100),
          size: Number(f.size) || 0,
          path: f.url.slice(prefix.length - `${briefId}/${auth.user.id}/`.length),
        }))
    : [];
  if (!files.length) {
    return NextResponse.json({ error: "Veuillez envoyer au moins un fichier" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: brief } = await admin
    .from("content_briefs")
    .select("id, title, status, store_id, selected_creator_id, is_disputed")
    .eq("id", briefId)
    .maybeSingle();
  if (!brief || brief.selected_creator_id !== auth.user.id) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }
  if (!["assigned", "in_progress"].includes(brief.status) || brief.is_disputed) {
    return NextResponse.json({ error: "Cette mission ne peut pas être livrée maintenant" }, { status: 400 });
  }

  const { error } = await admin.from("content_deliveries").insert({
    brief_id: briefId,
    creator_id: auth.user.id,
    files,
    message: typeof body.message === "string" ? body.message.slice(0, 2000) : null,
    status: "submitted",
    delivered_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "Erreur lors de l'enregistrement de la livraison" }, { status: 500 });

  await admin.from("content_briefs").update({ status: "delivered", updated_at: new Date().toISOString() }).eq("id", briefId);

  const { data: store } = await admin.from("stores").select("vendor_id").eq("id", brief.store_id).maybeSingle();
  await notify(
    store?.vendor_id,
    "📦 Contenu livré",
    `Le créateur a livré « ${brief.title} ». Vérifiez les fichiers puis validez ou demandez des retouches.`,
    `/seller/content/briefs/${briefId}`,
    "deliverable_submitted"
  );

  return NextResponse.json({ success: true });
}
