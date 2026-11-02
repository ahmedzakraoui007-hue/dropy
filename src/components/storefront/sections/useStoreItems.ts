"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ShowcaseItem = { image: string; title?: string; price?: number | string; compareAt?: number | null; link?: string; video?: string };

export function useStoreItems(config: any, storeId?: string, limit = 8) {
  const manual: ShowcaseItem[] = Array.isArray(config.items) ? config.items.filter((i: any) => i?.image || i?.video) : [];
  const [items, setItems] = useState<ShowcaseItem[]>(manual);
  const useStore = config.source === "store" || manual.length === 0;

  useEffect(() => {
    if (!useStore || !storeId) {
      setItems(manual);
      return;
    }
    createClient()
      .from("store_products")
      .select("id, name, images, selling_price, compare_at_price")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(config.limit || limit)
      .then(({ data }) => {
        const fromStore = (data || [])
          .filter((p: any) => Array.isArray(p.images) && p.images[0])
          .map((p: any) => ({ image: p.images[0], title: p.name, price: p.selling_price, compareAt: p.compare_at_price, link: `/p/${p.id}` }));
        setItems(fromStore.length ? fromStore : manual);
      });
  }, [storeId, useStore, config.limit, JSON.stringify(config.items || [])]);

  return items;
}

export function formatDt(value: number | string | undefined | null) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n.toFixed(3).replace(".", ",")} DT`;
}
