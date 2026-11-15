import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID = /^Expo(nent)?PushToken\[[^\]]{10,200}\]$/;

export async function POST(request: Request) {
  const auth = await requireUser(["seller", "admin", "agent"]);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const token = String(body?.token || "");
  if (!VALID.test(token)) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  const platform = ["ios", "android"].includes(body?.platform) ? body.platform : null;
  const { error } = await createAdminClient()
    .from("push_tokens")
    .upsert({ token, user_id: auth.user.id, platform, updated_at: new Date().toISOString() }, { onConflict: "token" });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  await createAdminClient().from("push_tokens").delete().eq("token", String(body?.token || "")).eq("user_id", auth.user.id);
  return NextResponse.json({ ok: true });
}
