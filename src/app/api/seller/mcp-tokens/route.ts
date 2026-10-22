import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMcpToken } from "@/lib/mcp-tokens";

const MAX_TOKENS = 5;

export async function GET() {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const { data } = await auth.supabase
    .from("seller_mcp_tokens")
    .select("id, name, token_prefix, created_at, last_used_at")
    .order("created_at", { ascending: false });
  return NextResponse.json({ tokens: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "Claude").trim().slice(0, 40) || "Claude";

  const admin = createAdminClient();
  const { count } = await admin.from("seller_mcp_tokens").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id);
  if ((count ?? 0) >= MAX_TOKENS) {
    return NextResponse.json({ error: "Limite de 5 clés atteinte : révoquez-en une." }, { status: 400 });
  }

  const { token, hash, prefix } = generateMcpToken();
  const { error } = await admin.from("seller_mcp_tokens").insert({ user_id: auth.user.id, name, token_hash: hash, token_prefix: prefix });
  if (error) return NextResponse.json({ error: "Création impossible" }, { status: 500 });
  return NextResponse.json({ token });
}

export async function DELETE(request: Request) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const { error } = await auth.supabase.from("seller_mcp_tokens").delete().eq("id", id).eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "Révocation impossible" }, { status: 500 });
  return NextResponse.json({ success: true });
}
