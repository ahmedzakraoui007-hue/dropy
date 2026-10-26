import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mail";
import { confirmLink } from "@/lib/auth-links";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MEMBERS = 20;

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function ownStore() {
  const auth = await requireUser(["seller", "admin"]);
  if (!auth.ok) return { response: auth.response } as const;
  const { data: store } = await auth.supabase
    .from("stores")
    .select("id, name")
    .eq("vendor_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return { response: json({ error: "store_not_found" }, 404) } as const;
  return { store, userId: auth.user.id } as const;
}

async function listMembers(storeId: string) {
  const { data } = await createAdminClient()
    .from("store_members")
    .select("id, email, full_name, status, created_at, user_id")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });
  return data || [];
}

async function sendInvite(request: Request, email: string, name: string, storeName: string) {
  const admin = createAdminClient();
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error || !link?.properties?.hashed_token) return false;
  const url = confirmLink(request, link.properties.hashed_token, "recovery");
  const safeStore = escapeHtml(storeName);
  await sendEmail({
    to: email,
    subject: `Invitation à l'équipe de ${storeName} sur Dropy`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Bonjour ${escapeHtml(name || "")}</h2>
        <p>La boutique <strong>${safeStore}</strong> vous invite à rejoindre son équipe de confirmation des commandes sur Dropy.</p>
        <p>Choisissez votre mot de passe, puis connectez-vous pour voir les commandes à confirmer.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Choisir mon mot de passe</a>
        </div>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${url}</p>
        <p dir="rtl" style="color: #374151;">متجر <strong>${safeStore}</strong> يدعوك للانضمام إلى فريق تأكيد الطلبات على Dropy. اختر كلمة المرور ثم سجّل الدخول.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">L'équipe Dropy</p>
      </div>`,
  });
  return true;
}

export async function GET() {
  const owner = await ownStore();
  if ("response" in owner) return owner.response;
  return json({ members: await listMembers(owner.store.id) });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "team-invite", 20, 3600);
  if (limited) return limited;
  const owner = await ownStore();
  if ("response" in owner) return owner.response;

  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "").trim().slice(0, 80);
  if (!EMAIL_RE.test(email) || email.length > 200) return json({ error: "invalid_email" }, 400);

  const admin = createAdminClient();
  const members = await listMembers(owner.store.id);
  if (members.length >= MAX_MEMBERS) return json({ error: "limit" }, 409);
  if (members.some((m) => m.email === email)) return json({ error: "already_member" }, 409);

  const { data: existing } = await admin.from("profiles").select("id, role").eq("email", email).maybeSingle();
  let userId = existing?.id as string | undefined;
  if (existing && existing.role !== "agent") return json({ error: "email_in_use" }, 409);
  if (userId === owner.userId) return json({ error: "email_in_use" }, 409);

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: randomBytes(24).toString("base64url"),
      email_confirm: true,
      user_metadata: { full_name: name || email, role: "agent" },
    });
    if (error || !created.user) return json({ error: /already/i.test(error?.message || "") ? "email_in_use" : "create_failed" }, 409);
    userId = created.user.id;
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({ id: userId, email, full_name: name || email, role: "agent", status: "approved" }, { onConflict: "id" });
    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: "create_failed" }, 500);
    }
  }

  const { error: memberError } = await admin
    .from("store_members")
    .insert({ store_id: owner.store.id, user_id: userId, email, full_name: name || null, role: "agent", status: "active" });
  if (memberError) return json({ error: "create_failed" }, 500);

  const invited = await sendInvite(request, email, name, owner.store.name).catch(() => false);
  return json({ members: await listMembers(owner.store.id), invited });
}

export async function PATCH(request: Request) {
  const owner = await ownStore();
  if ("response" in owner) return owner.response;
  const body = await request.json().catch(() => ({}));
  const id = String(body?.id || "");
  const admin = createAdminClient();
  const { data: member } = await admin.from("store_members").select("id, email, full_name").eq("id", id).eq("store_id", owner.store.id).maybeSingle();
  if (!member) return json({ error: "not_found" }, 404);

  if (body?.action === "resend") {
    const invited = await sendInvite(request, member.email, member.full_name || "", owner.store.name).catch(() => false);
    return json({ members: await listMembers(owner.store.id), invited });
  }
  const status = body?.status === "disabled" ? "disabled" : "active";
  await admin.from("store_members").update({ status }).eq("id", member.id);
  return json({ members: await listMembers(owner.store.id) });
}

export async function DELETE(request: Request) {
  const owner = await ownStore();
  if ("response" in owner) return owner.response;
  const id = new URL(request.url).searchParams.get("id") || "";
  await createAdminClient().from("store_members").delete().eq("id", id).eq("store_id", owner.store.id);
  return json({ members: await listMembers(owner.store.id) });
}
