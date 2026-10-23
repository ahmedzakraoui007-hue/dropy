"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PhoneCall } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";

export function AbandonedLeadsBanner() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!store) return;
      const { count: open } = await supabase
        .from("store_order_leads")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .eq("status", "open");
      setCount(open ?? 0);
    })();
  }, []);

  return (
    <Link
      href="/seller/orders/abandoned"
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${count > 0 ? "border-amber-200 bg-amber-50 hover:bg-amber-100" : "border-border hover:bg-muted"}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${count > 0 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
        <PhoneCall className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">
          {count > 0 ? t("seller_app.leads.banner_count").replace("{count}", String(count)) : t("seller_app.leads.title")}
        </span>
        <span className="block text-xs text-muted-foreground">{t("seller_app.leads.banner_help")}</span>
      </span>
      <span className="text-sm font-semibold text-primary">{t("seller_app.leads.open_list")}</span>
    </Link>
  );
}
