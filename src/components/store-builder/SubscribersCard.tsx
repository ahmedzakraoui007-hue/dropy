"use client";

import { useEffect, useState } from "react";
import { Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

export function SubscribersCard({ storeId }: { storeId: string }) {
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.settings.subscribers.${key}`);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    createClient()
      .from("store_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .then(({ count: total }) => setCount(total ?? 0));
  }, [storeId]);

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Mail className="w-5 h-5 text-purple-600" />{tr("title")}</CardTitle>
        <CardDescription>{tr("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-3xl font-black text-gray-900">
          {count ?? "…"} <span className="text-sm font-medium text-gray-500">{tr("count")}</span>
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <a href="/api/seller/subscribers/export" download>
            <Download className="w-4 h-4 me-2" />
            {tr("export")}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
