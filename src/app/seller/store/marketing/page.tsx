"use client";

import Link from "next/link";
import { ChevronRight, Mail, Megaphone, PhoneMissed, Search, Star, TicketPercent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/context/LanguageContext";

const TOOLS = [
  { key: "coupons", href: "/seller/store/marketing/coupons", icon: TicketPercent },
  { key: "abandoned", href: "/seller/orders/abandoned", icon: PhoneMissed },
  { key: "pixels", href: "/seller/store-builder/settings", icon: Megaphone },
  { key: "seo", href: "/seller/store-builder/settings", icon: Search },
  { key: "newsletter", href: "/seller/store-builder/settings", icon: Mail },
  { key: "reviews", href: "/seller/store/reviews", icon: Star },
];

export default function MarketingPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.marketing_page.${key}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{tr("title")}</h1>
        <p className="text-muted-foreground">{tr("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link key={tool.key} href={tool.href} className="group">
            <Card className="h-full rounded-2xl transition-colors group-hover:border-primary/40">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <tool.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{tr(`tools.${tool.key}`)}</p>
                  <p className="text-sm text-muted-foreground">{tr(`tools.${tool.key}_desc`)}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
