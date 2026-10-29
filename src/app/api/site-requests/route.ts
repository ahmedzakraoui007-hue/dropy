import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL } from "@/lib/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "site-request", 3, 600);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ code: "invalid" }, { status: 400 });
  if (body.website) return NextResponse.json({ ok: true });

  const row = {
    name: clean(body.name, 100),
    business: clean(body.business, 150),
    phone: clean(body.phone, 30),
    email: clean(body.email, 200).toLowerCase() || null,
    city: clean(body.city, 80) || null,
    activity: clean(body.activity, 120) || null,
    links: clean(body.links, 500) || null,
    message: clean(body.message, 2000) || null,
  };
  const digits = row.phone.replace(/\D/g, "");
  if (row.name.length < 2 || row.business.length < 2 || digits.length < 8 || (row.email && !EMAIL_RE.test(row.email))) {
    return NextResponse.json({ code: "invalid" }, { status: 400 });
  }

  const { error } = await createAdminClient().from("site_requests").insert(row);
  if (error) return NextResponse.json({ code: "save_failed" }, { status: 500 });

  const lines = [
    ["Nom", row.name],
    ["Entreprise", row.business],
    ["Téléphone", row.phone],
    ["E-mail", row.email],
    ["Ville", row.city],
    ["Activité", row.activity],
    ["Liens", row.links],
    ["Message", row.message],
  ].filter(([, v]) => v);
  await sendEmail({
    to: CONTACT_EMAIL,
    replyTo: row.email || undefined,
    subject: `[Site gratuit] ${row.business} — ${row.name}`,
    html: lines.map(([k, v]) => `<p><strong>${k} :</strong> <span style="white-space:pre-wrap">${escapeHtml(String(v))}</span></p>`).join(""),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
