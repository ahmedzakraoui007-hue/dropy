import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireUser(["agent"]);
  if (!auth.ok) return auth.response;
  const { data: memberships } = await auth.supabase
    .from("store_members")
    .select("store_id")
    .eq("user_id", auth.user.id)
    .eq("status", "active");
  const ids = (memberships || []).map((m) => m.store_id);
  if (!ids.length) return NextResponse.json({ stores: [] });
  const { data: stores } = await createAdminClient().from("stores").select("id, name, storefront_language").in("id", ids);
  return NextResponse.json({ stores: stores || [] });
}
