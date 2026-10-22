import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const limited = rateLimit(request, "subscribe", 10, 3600);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const storeId = String(body?.storeId || "");
  const email = String(body?.email || "").trim().toLowerCase();
  if (!storeId || !EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json({ success: false, code: "invalid_email" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: store } = await admin.from("stores").select("id, is_active").eq("id", storeId).maybeSingle();
  if (!store || !store.is_active) {
    return NextResponse.json({ success: false, code: "store_unavailable" }, { status: 404 });
  }

  const { error } = await admin
    .from("store_subscribers")
    .upsert({ store_id: store.id, email }, { onConflict: "store_id,email", ignoreDuplicates: true });
  if (error) return NextResponse.json({ success: false, code: "server_error" }, { status: 500 });

  return NextResponse.json({ success: true });
}
