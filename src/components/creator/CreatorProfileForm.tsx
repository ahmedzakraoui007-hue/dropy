"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { normalizeSpecialty } from "@/lib/matching";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Panel, useCreatorText } from "@/components/creator/shared";

const SPECIALTIES = ["photography", "video", "ugc", "design", "copywriting"];

const cleanHandle = (value: string) => value.trim().replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");

export function CreatorProfileForm() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.settings.profile.${key}`);
  const { typeLabel } = useCreatorText();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [minBudget, setMinBudget] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("creator_profiles")
        .select("bio, city, specialties, instagram_handle, instagram_username, tiktok_handle, min_project_budget")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      setBio(data.bio || "");
      setCity(data.city || "");
      setSpecialties(Array.from(new Set<string>(((data.specialties || []) as string[]).map(normalizeSpecialty))).filter((value) => SPECIALTIES.includes(value)));
      setInstagram(cleanHandle(data.instagram_handle || data.instagram_username || ""));
      setTiktok(cleanHandle(data.tiktok_handle || ""));
      setMinBudget(data.min_project_budget ? String(data.min_project_budget) : "");
      setUserId(user.id);
    }
    load();
  }, [supabase]);

  if (!userId) return null;

  const toggle = (value: string) => setSpecialties((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));

  const save = async () => {
    setSaving(true);
    const handle = cleanHandle(instagram);
    const { error } = await supabase
      .from("creator_profiles")
      .update({
        bio: bio.trim().slice(0, 600),
        city: city.trim().slice(0, 60),
        specialties,
        specialty: specialties[0] || "",
        instagram_handle: handle,
        instagram_username: handle,
        tiktok_handle: cleanHandle(tiktok),
        min_project_budget: Number(minBudget) > 0 ? Number(minBudget) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setSaving(false);
    if (error) toast.error(tr("error"));
    else toast.success(tr("saved"));
  };

  const field = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary";

  return (
    <Panel title={tr("title")}>
      <p className="-mt-2 mb-5 text-sm text-gray-500">{tr("desc")}</p>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="creator-bio">{tr("bio")}</Label>
          <Textarea id="creator-bio" value={bio} maxLength={600} placeholder={tr("bio_ph")} className="min-h-[110px]" onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{tr("specialties")}</Label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((value) => {
              const active = specialties.includes(value);
              return (
                <button key={value} type="button" aria-pressed={active} onClick={() => toggle(value)} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${active ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {active && <Check className="h-3.5 w-3.5" />}
                  {typeLabel(value)}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">{tr("specialties_help")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="creator-city">{tr("city")}</Label>
          <input id="creator-city" className={field} value={city} maxLength={60} placeholder={tr("city_ph")} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creator-budget">{tr("min_budget")}</Label>
          <input id="creator-budget" type="number" min="0" inputMode="numeric" className={field} value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creator-instagram">{tr("instagram")}</Label>
          <input id="creator-instagram" dir="ltr" className={field} value={instagram} placeholder="@" onChange={(e) => setInstagram(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creator-tiktok">{tr("tiktok")}</Label>
          <input id="creator-tiktok" dir="ltr" className={field} value={tiktok} placeholder="@" onChange={(e) => setTiktok(e.target.value)} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {tr("save")}
        </button>
        <p className="text-xs text-gray-500">{tr("delay")}</p>
      </div>
    </Panel>
  );
}
