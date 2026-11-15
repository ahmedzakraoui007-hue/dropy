import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "https://dropy.store").replace(/\/+$/, "");
export const STORE_DOMAIN = process.env.EXPO_PUBLIC_STORE_DOMAIN || "dropy.store";

export const supabase = createClient(SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "", {
  auth: {
    storage: Platform.OS === "web" && typeof window === "undefined" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export class ApiError extends Error {}

export async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(json?.error || `HTTP ${response.status}`);
  return json as T;
}

export function storeLink(store: { slug: string; custom_domain?: string | null; custom_domain_status?: string | null }) {
  if (store.custom_domain && store.custom_domain_status === "active") return `https://${store.custom_domain}`;
  return `https://${store.slug}.${STORE_DOMAIN}`;
}
