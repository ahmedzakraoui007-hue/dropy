import { createClient } from "@supabase/supabase-js";

export type StorefrontInitial = { store: Record<string, any>; pages: any[] };

export async function loadStorefront(slug: string): Promise<StorefrontInitial | null> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data: store } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
  if (!store) return null;
  const [{ data: pages }, { data: nav }] = await Promise.all([
    supabase.from("store_pages").select("*").eq("store_id", store.id).eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("store_navigation").select("type, items").eq("store_id", store.id),
  ]);
  const navItems = (type: string) => (nav || []).find((n: any) => n.type === type)?.items || [];
  return { store: { ...store, headerLinks: navItems("header"), footerLinks: navItems("footer") }, pages: pages || [] };
}
