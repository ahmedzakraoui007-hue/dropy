"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Palette,
  Navigation,
  Settings,
  LayoutTemplate,
  ChevronLeft,
  Store,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { storeViewHref } from "@/lib/store-url";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useTranslation } from "@/context/LanguageContext";

const navItems = [
  { key: "hub", href: "/seller/store-builder", icon: LayoutDashboard },
  { key: "editor", href: "/seller/store-builder/builder", icon: LayoutTemplate },
  { key: "themes", href: "/seller/store-builder/themes", icon: Palette },
  { key: "menus", href: "/seller/store-builder/navigation", icon: Navigation },
  { key: "settings", href: "/seller/store-builder/settings", icon: Settings },
];

export default function StoreBuilderLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { store } = useSellerStore();
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.nav.${key}`);
  const storeHref = store?.slug ? storeViewHref(store.slug, store.is_active) : "/seller/store-builder";

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50/50">
      <aside className="hidden md:flex w-64 bg-white border-e border-gray-200 flex-col shrink-0">
        <div className="p-6">
          <Link href="/seller/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{tr("back")}</span>
          </Link>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-teal-500 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">{store?.name || tr("title")}</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{tr("title")}</p>
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
                  isActive ? "bg-purple-50 text-purple-700 shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-purple-600" : "text-gray-400 group-hover:text-gray-600")} />
                {tr(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-purple-100 flex items-center gap-2">
            <Link href={storeHref} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" />
              {tr("view_store")}
            </Link>
          </Button>
        </div>
      </aside>

      <header className="md:hidden bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between gap-3 px-4 h-14">
          <Link href="/seller/dashboard" className="flex items-center gap-1 text-sm font-medium text-gray-600" aria-label={tr("back")}>
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            <span className="truncate max-w-[50vw] font-bold text-gray-900">{store?.name || tr("title")}</span>
          </Link>
          <Button asChild size="sm" variant="outline" className="rounded-xl shrink-0">
            <Link href={storeHref} target="_blank" rel="noreferrer" aria-label={tr("view_store")}>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 [scrollbar-width:none]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold",
                  isActive ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {tr(item.key)}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
