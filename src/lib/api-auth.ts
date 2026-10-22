import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type AuthResult =
  | { ok: true; user: User; role: string; supabase: Supabase }
  | { ok: false; response: NextResponse };

export async function requireUser(roles?: string[]): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "";
  const active = Boolean(profile) && ["approved", "active"].includes(profile?.status ?? "");

  if (roles && (!active || !roles.includes(role))) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, user, role, supabase };
}
