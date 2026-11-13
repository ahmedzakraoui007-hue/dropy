import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const HOSTS = ["pixabay.com", "cdn.pixabay.com", "images.pexels.com", "upload.wikimedia.org", "thumb.wikimedia.org"];
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 15 * 1024 * 1024;

function allowed(raw: unknown) {
  try {
    const url = new URL(String(raw));
    return url.protocol === "https:" && HOSTS.includes(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const url = allowed(body?.url);
  if (!url) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const admin = createAdminClient();
  const { data: store } = await admin
    .from("stores")
    .select("id")
    .eq("vendor_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return NextResponse.json({ error: "no_store" }, { status: 400 });

  const response = await fetch(url, {
    redirect: "error",
    headers: { "User-Agent": "DropyMediaSearch/1.0 (https://dropy.store)" },
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  const type = response?.headers.get("content-type")?.split(";")[0].trim() || "";
  if (!response?.ok || !TYPES[type]) return NextResponse.json({ error: "download_failed" }, { status: 502 });
  if (Number(response.headers.get("content-length") || 0) > MAX_BYTES) return NextResponse.json({ error: "too_big" }, { status: 413 });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) return NextResponse.json({ error: "too_big" }, { status: 413 });

  const source = url.hostname.includes("pixabay") ? "pixabay" : url.hostname.includes("pexels") ? "pexels" : "wikimedia";
  const path = `${auth.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${TYPES[type]}`;
  const { error: uploadError } = await admin.storage.from("media").upload(path, bytes, { contentType: type });
  if (uploadError) return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  const publicUrl = admin.storage.from("media").getPublicUrl(path).data.publicUrl;

  const filename = String(body?.name || `${source}-photo`).slice(0, 200);
  const { data: row } = await admin
    .from("media_library")
    .insert({ store_id: store.id, file_url: publicUrl, filename, file_type: type, file_size: bytes.length, source })
    .select("id, file_url, filename")
    .single();

  return NextResponse.json({ url: publicUrl, media: row });
}
