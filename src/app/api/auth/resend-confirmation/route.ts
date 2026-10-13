import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/mail";
import { confirmLink } from "@/lib/auth-links";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ success: true });

    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!profile) return NextResponse.json({ success: true });

    const { data: existing } = await supabase.auth.admin.getUserById(profile.id);
    if (!existing?.user || existing.user.email_confirmed_at) {
      return NextResponse.json({ success: true });
    }

    const { data: linkData, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !linkData?.properties) {
      console.error("Resend confirmation link error:", error);
      return NextResponse.json({ code: "email_send_failed", error: "Could not generate link" }, { status: 500 });
    }

    await sendConfirmationEmail(
      email,
      confirmLink(req, linkData.properties.hashed_token, linkData.properties.verification_type)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend confirmation error:", error);
    return NextResponse.json({ code: "email_send_failed", error: "Could not send email" }, { status: 502 });
  }
}
