import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmLink } from "@/lib/auth-links";
import { sendEmail } from "@/lib/mail";
import { storeUrl } from "@/lib/store-url";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(request: Request) {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const storeId = String(body?.storeId || "");
  const admin = createAdminClient();
  const { data: store } = await admin.from("stores").select("id, name, slug, vendor_id, agency_created_by").eq("id", storeId).maybeSingle();
  if (!store || !store.agency_created_by) return NextResponse.json({ error: "Boutique client introuvable" }, { status: 404 });
  const { data: owner } = await admin.from("profiles").select("email, full_name").eq("id", store.vendor_id).maybeSingle();
  if (!owner?.email) return NextResponse.json({ error: "Propriétaire introuvable" }, { status: 404 });

  const { data: linkData, error } = await admin.auth.admin.generateLink({ type: "recovery", email: owner.email });
  if (error || !linkData?.properties?.hashed_token) return NextResponse.json({ error: "Lien impossible à générer" }, { status: 500 });
  const link = confirmLink(request, linkData.properties.hashed_token, "recovery");

  let emailSent = false;
  if (body?.sendEmail !== false) {
    const firstName = escapeHtml((owner.full_name || "").split(" ")[0] || "");
    const name = escapeHtml(store.name);
    const sent = await sendEmail({
      to: owner.email,
      subject: `Votre boutique ${store.name} est prête sur Dropy`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
<h2 style="color:#2E3192">Bonjour ${firstName},</h2>
<p>Votre boutique en ligne <strong>${name}</strong> est prête : <a href="${storeUrl(store.slug)}">${storeUrl(store.slug)}</a></p>
<p>Choisissez votre mot de passe pour accéder à votre tableau de bord : commandes, produits et réglages.</p>
<p style="margin:28px 0"><a href="${link}" style="background:#2E3192;color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:bold">Choisir mon mot de passe</a></p>
<p style="color:#64748b;font-size:13px">Ce lien est valable pour une durée limitée. S'il a expiré, utilisez « Mot de passe oublié » sur la page de connexion avec votre e-mail : ${escapeHtml(owner.email)}</p>
<p>L'équipe Dropy</p></div>`,
    }).catch(() => null);
    emailSent = Boolean(sent);
  }

  await admin.from("stores").update({ handed_over_at: new Date().toISOString() }).eq("id", store.id);
  return NextResponse.json({ link, email: owner.email, emailSent });
}
