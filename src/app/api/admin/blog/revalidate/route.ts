import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const slugs = [body?.slug, body?.previousSlug].filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,80}$/.test(s));

  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs) revalidatePath(`/blog/${slug}`);

  return NextResponse.json({ ok: true });
}
