import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL } from "@/lib/contact";

const SUBJECTS = new Set(["seller", "creator", "supplier", "support", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "contact", 5, 600);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ code: "invalid" }, { status: 400 });
  if (body.website) return NextResponse.json({ ok: true });

  const firstName = String(body.firstName || "").trim().slice(0, 80);
  const lastName = String(body.lastName || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().slice(0, 200);
  const subject = SUBJECTS.has(body.subject) ? String(body.subject) : "other";
  const message = String(body.message || "").trim().slice(0, 5000);

  if (!firstName || !EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json({ code: "invalid" }, { status: 400 });
  }

  try {
    const sent = await sendEmail({
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[Contact Dropy] ${subject} — ${firstName} ${lastName}`.trim(),
      html: `<p><strong>${escapeHtml(`${firstName} ${lastName}`.trim())}</strong> &lt;${escapeHtml(email)}&gt;</p>
<p>Sujet : ${escapeHtml(subject)}</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
    if (!sent) return NextResponse.json({ code: "mail_unavailable" }, { status: 503 });
  } catch {
    return NextResponse.json({ code: "mail_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
