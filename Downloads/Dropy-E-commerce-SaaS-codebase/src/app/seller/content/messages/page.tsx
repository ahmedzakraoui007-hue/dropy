"use client";

import { Suspense } from "react";
import { Messaging } from "@/components/content/Messaging";
import { Loader2 } from "lucide-react";

function MessagesContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Gérez vos communications avec les créateurs</p>
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
