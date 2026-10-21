"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SellerStore {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  theme_config: Record<string, any> | null;
  seo_title: string | null;
  seo_description: string | null;
  whatsapp_number: string | null;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_analytics_id: string | null;
  google_site_verification: string | null;
  facebook_domain_verification: string | null;
  delivery_fee: number | string | null;
  free_delivery_threshold: number | string | null;
  quantity_offers: unknown;
  created_at: string;
}

export function useSellerStore() {
  const [store, setStore] = useState<SellerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStore = () =>
      supabase
        .from("stores")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    const ensured = await fetch("/api/seller/store", { method: "POST" });
    const { data } = await fetchStore();
    if (!data && !ensured.ok) setError("Impossible de charger votre boutique. Contactez le support.");
    setStore((data as SellerStore) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { store, setStore, loading, error, reload: load };
}
