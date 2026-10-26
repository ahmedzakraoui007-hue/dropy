"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarChart3, ListOrdered, PhoneMissed, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";

const TABS = [
  { href: "/seller/orders", key: "seller_app.orders.section_tabs.all", icon: ListOrdered },
  { href: "/seller/orders/abandoned", key: "seller_app.orders.section_tabs.abandoned", icon: PhoneMissed },
  { href: "/seller/orders/team", key: "seller_app.team.open", icon: Users },
  { href: "/seller/orders/stats", key: "seller_app.stats.open", icon: BarChart3 },
  { href: "/seller/orders/protection", key: "seller_app.protection.open", icon: ShieldCheck },
];

export default function OrdersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const current = TABS.find((tab) => tab.href === pathname);

  if (!current) return <>{children}</>;

  return (
    <>
      <nav aria-label={t("seller_app.orders.title")} className="container mx-auto pt-6">
        <div className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const active = tab.href === current.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {t(tab.key)}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </>
  );
}
