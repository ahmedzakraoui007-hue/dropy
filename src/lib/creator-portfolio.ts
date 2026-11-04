import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/store-url";

export type PublicItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  type: string | null;
  thumbnail_url: string | null;
  content_url: string | null;
};

export type PublicCreator = {
  slug: string;
  name: string;
  avatar: string | null;
  city: string | null;
  bio: string | null;
  instagram: string | null;
  tiktok: string | null;
  verified: boolean;
  projects: number;
  rating: number | null;
  reviews: number;
};

export type DirectoryCreator = PublicCreator & { cover: PublicItem | null; count: number };

const COLUMNS = "user_id, public_slug, display_name, city, bio, instagram_handle, instagram_username, tiktok_handle, is_verified, status, total_projects, rating, total_reviews";
const ITEM_COLUMNS = "id, creator_id, title, description, category, type, thumbnail_url, content_url";

export function portfolioUrl(slug: string) {
  return `${SITE_URL}/createurs/${slug}`;
}

const handle = (value: string | null) => (value ? value.trim().replace(/^@/, "") || null : null);
const safeUrl = (value: string | null) => (value && /^https?:\/\//i.test(value) ? value : null);

function client() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createAdminClient();
}

function toCreator(row: any, profile?: { full_name?: string | null; avatar_url?: string | null }): PublicCreator {
  return {
    slug: row.public_slug,
    name: row.display_name || profile?.full_name?.split(" ")[0] || row.public_slug,
    avatar: safeUrl(profile?.avatar_url ?? null),
    city: row.city,
    bio: row.bio,
    instagram: handle(row.instagram_handle || row.instagram_username),
    tiktok: handle(row.tiktok_handle),
    verified: row.is_verified === true,
    projects: row.total_projects || 0,
    rating: row.total_reviews > 0 ? Number(row.rating) : null,
    reviews: row.total_reviews || 0,
  };
}

function toItem(row: any): PublicItem | null {
  const content = safeUrl(row.content_url);
  const thumbnail = safeUrl(row.thumbnail_url);
  if (!content && !thumbnail) return null;
  return { id: row.id, title: row.title, description: row.description, category: row.category, type: row.type, thumbnail_url: thumbnail, content_url: content };
}

const isPublished = (row: any) => row.is_verified === true || ["approved", "active"].includes(row.status);

export async function publicPortfolio(slug: string) {
  const admin = client();
  if (!admin) return null;
  const { data: row } = await admin.from("creator_profiles").select(COLUMNS).eq("public_slug", slug).eq("portfolio_public", true).maybeSingle();
  if (!row || !isPublished(row)) return null;
  const [{ data: profile }, { data: items }] = await Promise.all([
    admin.from("profiles").select("full_name, avatar_url").eq("id", row.user_id).maybeSingle(),
    admin.from("creator_portfolio").select(ITEM_COLUMNS).eq("creator_id", row.user_id).order("created_at", { ascending: false }).limit(60),
  ]);
  return { creator: toCreator(row, profile || undefined), items: (items || []).map(toItem).filter(Boolean) as PublicItem[] };
}

export async function publicCreators(limit = 60): Promise<DirectoryCreator[]> {
  const admin = client();
  if (!admin) return [];
  const { data: rows } = await admin.from("creator_profiles").select(COLUMNS).eq("portfolio_public", true).not("public_slug", "is", null).limit(limit);
  const published = (rows || []).filter(isPublished);
  if (!published.length) return [];
  const ids = published.map((row) => row.user_id);
  const [{ data: profiles }, { data: items }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url").in("id", ids),
    admin.from("creator_portfolio").select(ITEM_COLUMNS).in("creator_id", ids).order("created_at", { ascending: false }),
  ]);
  return published
    .map((row) => {
      const own = (items || []).filter((item) => item.creator_id === row.user_id).map(toItem).filter(Boolean) as PublicItem[];
      return { ...toCreator(row, (profiles || []).find((p) => p.id === row.user_id)), cover: own.find((item) => item.thumbnail_url) || own[0] || null, count: own.length };
    })
    .filter((creator) => creator.count > 0);
}
