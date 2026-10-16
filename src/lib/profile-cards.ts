import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileCard = { id: string; full_name: string | null; avatar_url: string | null; role: string | null };

export async function fetchProfileCards(supabase: SupabaseClient, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const cards = new Map<string, ProfileCard>();
  if (!unique.length) return cards;
  const { data } = await supabase.from("profile_cards").select("id, full_name, avatar_url, role").in("id", unique);
  for (const card of data || []) cards.set(card.id, card);
  return cards;
}
