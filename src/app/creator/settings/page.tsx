"use client";

import { useTranslation } from "@/context/LanguageContext";
import { SettingsForm } from "@/components/profile/SettingsForm";

export default function SettingsPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`creator_app.settings.${key}`);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{tr("parametres")}</h1>
        <p className="text-muted-foreground">{tr("gerez_votre_compte_et_vos")}</p>
      </div>
      <SettingsForm />
    </div>
  );
}
