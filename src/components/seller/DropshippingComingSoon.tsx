"use client";

import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/LanguageContext";

export function DropshippingComingSoon() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.dropshipping_soon.${key}`);
  return (
    <div className="container mx-auto max-w-2xl py-16">
      <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-10 text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
          <Truck className="h-7 w-7" />
        </span>
        <span className="mb-3 inline-block rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">{tr("badge")}</span>
        <h1 className="text-2xl font-black text-gray-900">{tr("title")}</h1>
        <p className="mx-auto mt-3 max-w-md text-gray-600">{tr("text")}</p>
        <Link href="/seller/products/add?new=1">
          <Button className="mt-8 rounded-xl">
            <Plus className="me-2 h-4 w-4" />
            {tr("cta")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
