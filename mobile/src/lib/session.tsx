import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Store = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean | null;
  custom_domain: string | null;
  custom_domain_status: string | null;
};

export type Profile = { id: string; full_name: string | null; role: string; status: string };

export const SELLER_ROLES = ["seller", "admin", "agent"];
export const ACTIVE_STATUSES = ["approved", "active"];

type Ctx = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  stores: Store[];
  store: Store | null;
  storeIds: string[];
  refreshStores: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

async function loadStores(userId: string, role: string): Promise<Store[]> {
  const columns = "id, name, slug, logo_url, is_active, custom_domain, custom_domain_status";
  const { data: own } = await supabase.from("stores").select(columns).eq("vendor_id", userId).order("created_at", { ascending: true });
  if (own?.length || role !== "agent") return (own || []) as Store[];
  const { data: memberships } = await supabase.from("store_members").select("store_id").eq("user_id", userId).eq("status", "active");
  const ids = (memberships || []).map((m) => m.store_id);
  if (!ids.length) return [];
  const { data } = await supabase.from("stores").select(columns).in("id", ids);
  return (data || []) as Store[];
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const hydrate = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next) {
      setProfile(null);
      setStores([]);
      setReady(true);
      return;
    }
    const { data } = await supabase.from("profiles").select("id, full_name, role, status").eq("id", next.user.id).maybeSingle();
    const p = (data as Profile) || null;
    setProfile(p);
    setStores(p ? await loadStores(next.user.id, p.role) : []);
    setReady(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") hydrate(next);
      else if (event === "TOKEN_REFRESHED") setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const refreshStores = useCallback(async () => {
    if (session && profile) setStores(await loadStores(session.user.id, profile.role));
  }, [session, profile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      profile,
      stores,
      store: stores[0] || null,
      storeIds: stores.map((s) => s.id),
      refreshStores,
      signOut,
    }),
    [ready, session, profile, stores, refreshStores, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside provider");
  return ctx;
}

export function isAllowedSeller(profile: Profile | null) {
  return Boolean(profile && SELLER_ROLES.includes(profile.role) && ACTIVE_STATUSES.includes(profile.status));
}
