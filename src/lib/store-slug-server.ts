import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugError, slugify } from "@/lib/store-slug";

export async function uniqueStoreSlug(supabase: SupabaseClient, name: string) {
  const base = slugify(name).slice(0, 32) || "boutique";
  const candidates = [base, ...Array.from({ length: 5 }, () => `${base}-${randomBytes(2).toString("hex")}`)];
  for (const candidate of candidates) {
    if (slugError(candidate)) continue;
    const { data } = await supabase.from("stores").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `boutique-${randomBytes(4).toString("hex")}`;
}
