import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendWaitingEmail } from "@/lib/auth-emails";

const ALLOWED_TYPES: EmailOtpType[] = ["signup", "magiclink", "email", "invite", "recovery"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error || !data.user) {
    console.error("Email confirmation error:", error);
    return NextResponse.redirect(
      `${origin}${type === "recovery" ? "/forgot-password?error=expired" : "/login?error=invalid_link"}`
    );
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  await supabase.auth.signOut();

  if (!profile || profile.status === "pending") {
    const firstName = (profile?.full_name || data.user.user_metadata?.full_name || "").split(" ")[0];
    await sendWaitingEmail(data.user.email!, firstName);
    return NextResponse.redirect(`${origin}/demande-en-attente`);
  }

  return NextResponse.redirect(`${origin}/login?message=email-confirmed`);
}
