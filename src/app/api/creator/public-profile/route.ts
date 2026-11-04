import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugError, slugify } from "@/lib/store-slug";

const COLUMNS = "public_slug, display_name, portfolio_public, status, is_verified";

async function currentCreator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const [{ data: creator }, { data: profile }] = await Promise.all([
    admin.from("creator_profiles").select(COLUMNS).eq("user_id", user.id).maybeSingle(),
    admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  return creator ? { admin, userId: user.id, creator, fullName: profile?.full_name || "" } : null;
}

const canPublish = (creator: { status: string | null; is_verified: boolean | null }) => creator.is_verified === true || ["approved", "active"].includes(creator.status || "");

export async function GET() {
  const current = await currentCreator();
  if (!current) return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  const { creator, fullName } = current;
  return NextResponse.json({
    slug: creator.public_slug || "",
    suggestedSlug: slugify(fullName),
    displayName: creator.display_name || fullName.split(" ")[0] || "",
    isPublic: creator.portfolio_public,
    canPublish: canPublish(creator),
  });
}

export async function PUT(request: Request) {
  const current = await currentCreator();
  if (!current) return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  const { admin, userId, creator } = current;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ code: "invalid" }, { status: 400 });

  const slug = String(body.slug ?? "").trim().toLowerCase();
  const displayName = String(body.displayName ?? "").trim().slice(0, 60);
  const isPublic = body.isPublic === true;

  if (slug === "portfolios" || slugError(slug)) return NextResponse.json({ code: "slug_invalid" }, { status: 400 });
  if (!displayName) return NextResponse.json({ code: "name_required" }, { status: 400 });
  if (isPublic && !canPublish(creator)) return NextResponse.json({ code: "not_approved" }, { status: 403 });

  const { error } = await admin
    .from("creator_profiles")
    .update({ public_slug: slug, display_name: displayName, portfolio_public: isPublic })
    .eq("user_id", userId);
  if (error?.code === "23505") return NextResponse.json({ code: "slug_taken" }, { status: 409 });
  if (error) return NextResponse.json({ code: "failed" }, { status: 500 });

  revalidatePath("/createurs/portfolios");
  revalidatePath(`/createurs/${slug}`);
  if (creator.public_slug && creator.public_slug !== slug) revalidatePath(`/createurs/${creator.public_slug}`);
  return NextResponse.json({ ok: true });
}
