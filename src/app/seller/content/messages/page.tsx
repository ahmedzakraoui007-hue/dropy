"use client";

import { Suspense } from "react";
import { Messaging } from "@/components/content/Messaging";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

function MessagesContent() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">{t("seller_app.messaging.page_title")}</h1>
        <p className="mt-1 text-gray-500">{t("seller_app.messaging.page_subtitle")}</p>
      </div>
      <Messaging userRole="seller" />
    </div>
  );
}

export default function SellerMessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
