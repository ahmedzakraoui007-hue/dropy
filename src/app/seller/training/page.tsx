"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, Megaphone, Package, PhoneCall, Rocket, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/context/LanguageContext";

const STEPS = [
  { key: "store", href: "/seller/store-builder/start", icon: Store },
  { key: "products", href: "/seller/products/catalog", icon: Package },
  { key: "publish", href: "/seller/store-builder", icon: Rocket },
  { key: "ads", href: "/seller/store-builder/settings", icon: Megaphone },
  { key: "confirm", href: "/seller/orders", icon: PhoneCall },
  { key: "ship", href: "/seller/shipping", icon: Truck },
];

const BLOG_URL = "/blog";

export default function TrainingPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.training_page.${key}`);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tr("title")}</h1>
        <p className="mt-1 text-gray-500">{tr("subtitle")}</p>
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.key}>
            <Card className="rounded-2xl transition-colors hover:border-primary/40">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4 sm:flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">{tr("step")} {index + 1}</p>
                    <p className="font-semibold">{tr(`steps.${step.key}`)}</p>
                    <p className="text-sm text-muted-foreground">{tr(`steps.${step.key}_desc`)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
                  <Link href={step.href}>
                    {tr("open")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500 text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <BookOpen className="h-8 w-8 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{tr("blog_title")}</p>
            <p className="text-sm text-white/80">{tr("blog_desc")}</p>
          </div>
          <Button variant="secondary" asChild className="gap-1.5">
            <a href={BLOG_URL} target="_blank" rel="noreferrer">
              {tr("blog_open")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
