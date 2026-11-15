import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createTokenClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Supabase = SupabaseClient;

async function clientForRequest(): Promise<{ supabase: Supabase; token?: string }> {
  const authorization = (await headers()).get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { supabase: (await createClient()) as unknown as Supabase };
  const supabase = createTokenClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { supabase, token };
}

type AuthResult =
  | { ok: true; user: User; role: string; supabase: Supabase }
  | { ok: false; response: NextResponse };

export async function requireUser(roles?: string[]): Promise<AuthResult> {
  const { supabase, token } = await clientForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

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
