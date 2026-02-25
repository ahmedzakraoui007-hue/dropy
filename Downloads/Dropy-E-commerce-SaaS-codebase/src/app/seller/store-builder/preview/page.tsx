"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  RefreshCw, 
  Eye, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
    RotateCcw,
    Globe
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PreviewPage() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function loadStore() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data } = await supabase
            .from("stores")
            .select("*")
            .eq("vendor_id", user.id)
            .single();
        setStore(data);
      }
      setLoading(false);
    }
    loadStore();
  }, []);

  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  if (!store) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Aucune boutique trouvée</h1>
        <p className="text-gray-500">Vous devez d'abord créer une boutique pour accéder à l'aperçu.</p>
        <Button asChild>
          <a href="/seller/store/create">Créer une boutique</a>
        </Button>
      </div>
    );
  }

  const viewWidths: any = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900 uppercase tracking-tight">APERÇU EN DIRECT</h1>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl ml-4">
            <Button 
              variant={viewMode === "desktop" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-lg h-9 w-9 p-0"
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "tablet" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-lg h-9 w-9 p-0"
              onClick={() => setViewMode("tablet")}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "mobile" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-lg h-9 w-9 p-0"
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={refreshPreview} className="rounded-xl border-gray-200">
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Actualiser
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl border-gray-200">
            <Link href={`/preview/${store?.slug}`} target="_blank">
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Ouvrir dans un onglet
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-8 flex justify-center">
        <div className={cn(
          "bg-white shadow-2xl transition-all duration-500 overflow-hidden rounded-2xl border border-gray-200 flex flex-col",
          viewWidths[viewMode]
        )}>
          <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
            </div>
            <div className="bg-white px-4 py-1 rounded-lg text-[10px] font-mono text-gray-400 border border-gray-100 flex items-center gap-2">
              <Globe className="w-3 h-3" />
              dropy.store/shop/{store?.slug}
            </div>
            <div className="w-10" />
          </div>
          <iframe 
            ref={iframeRef}
            src={`/preview/${store?.slug}`}
            className="flex-1 w-full border-0 bg-white"
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
}
