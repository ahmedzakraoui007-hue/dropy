"use client";

import { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Palette, 
  FileText, 
  Navigation, 
  Settings, 
  Eye, 
  ChevronLeft,
  Store,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface StoreBuilderLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    title: "Tableau de bord",
    href: "/seller/store-builder",
    icon: LayoutDashboard,
  },
  {
    title: "Design & Thèmes",
    href: "/seller/store-builder/design",
    icon: Palette,
  },
  {
    title: "Pages",
    href: "/seller/store-builder/pages",
    icon: FileText,
  },
  {
    title: "Navigation",
    href: "/seller/store-builder/navigation",
    icon: Navigation,
  },
  {
    title: "Paramètres",
    href: "/seller/store-builder/settings",
    icon: Settings,
  },
  {
    title: "Aperçu en direct",
    href: "/seller/store-builder/preview",
    icon: Eye,
  },
];

export default function StoreBuilderLayout({ children }: StoreBuilderLayoutProps) {
  const pathname = usePathname();
  const [store, setStore] = useState<any>(null);

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
    }
    loadStore();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6">
          <Link href="/seller/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Store Builder</h1>
              <p className="text-[10px] text-gray-500 font-medium">DROPY PLATFORM</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-50 text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Button 
            asChild
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <Link href={store?.slug ? `/shop/${store.slug}` : "/seller/store-builder"} target="_blank">
              <ExternalLink className="w-4 h-4" />
              Voir ma boutique
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
