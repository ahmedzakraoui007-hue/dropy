"use client";

import { SettingsForm } from "@/components/profile/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et vos préférences de créateur.</p>
      </div>
      <SettingsForm />
    </div>
  );
}
