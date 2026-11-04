"use client";

import { useTranslation } from "@/context/LanguageContext";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { CreatorProfileForm } from "@/components/creator/CreatorProfileForm";

export default function SettingsPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`creator_app.settings.${key}`);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">{tr("parametres")}</h1>
        <p className="mt-1 text-gray-500">{tr("gerez_votre_compte_et_vos")}</p>
      </div>
      <CreatorProfileForm />
      <SettingsForm />
    </div>
  );
}
