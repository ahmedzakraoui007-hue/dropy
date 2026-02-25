"use client";

import { Messaging } from "@/components/content/Messaging";

export default function CreatorMessagesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with sellers about your missions</p>
      </div>
      <Messaging userRole="creator" />
    </div>
  );
}
