"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LegacyPageEditorRedirect() {
  const { pageId } = useParams();
  const router = useRouter();

  useEffect(() => {
    createClient()
      .from("store_pages")
      .select("slug")
      .eq("id", pageId as string)
      .maybeSingle()
      .then(({ data }) => {
        router.replace(data?.slug ? `/seller/store-builder/builder?page=${encodeURIComponent(data.slug)}` : "/seller/store-builder/builder");
      });
  }, [pageId, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
