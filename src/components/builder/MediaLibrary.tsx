"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Globe, Image as ImageIcon, Loader2, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { FREE_PHOTO_IDS, freePhotoUrl } from "@/lib/free-photos";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface MediaLibraryProps {
  onSelect: (url: string) => void;
}

type Media = { id: string; file_url: string; filename: string | null };
type Photo = { id: string; thumb: string; full: string; alt: string };

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const CURATED: Photo[] = FREE_PHOTO_IDS.map((id) => ({ id, thumb: freePhotoUrl(id, 400), full: freePhotoUrl(id), alt: "" }));

export default function MediaLibrary({ onSelect }: MediaLibraryProps) {
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.media.${key}`);
  const [tab, setTab] = useState<"mine" | "free">("mine");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [photos, setPhotos] = useState<Photo[]>(CURATED);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMine = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setStoreId(store?.id ?? null);
    if (store?.id) {
      const { data } = await supabase
        .from("media_library")
        .select("id, file_url, filename")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(200);
      setMedia(data || []);
    }
    setLoadingMine(false);
  }, []);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const upload = async (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error(tr("bad_type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(tr("too_big"));
      return;
    }
    if (!userId || !storeId) {
      toast.error(tr("upload_error"));
      return;
    }
    setUploading(true);
    const supabase = createClient();
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const { data: row, error: dbError } = await supabase
        .from("media_library")
        .insert({ store_id: storeId, file_url: publicUrl, filename: file.name.slice(0, 200), file_type: file.type, file_size: file.size, source: "upload" })
        .select("id, file_url, filename")
        .single();
      if (dbError) throw dbError;
      setMedia((prev) => [row, ...prev]);
      onSelect(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(tr("upload_error"));
    } finally {
      setUploading(false);
    }
  };

  const runSearch = async () => {
    const query = search.trim();
    if (!query) {
      setPhotos(CURATED);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/media/unsplash/search?query=${encodeURIComponent(query)}&per_page=24`);
      const data = await res.json();
      if (!res.ok || data.setup_required || data.error) {
        setPhotos(CURATED);
        toast.info(tr("search_unavailable"));
        return;
      }
      setPhotos(
        (data.results || []).map((p: any) => ({ id: p.id, thumb: p.urls?.small, full: p.urls?.regular, alt: p.alt_description || "" }))
      );
    } catch {
      setPhotos(CURATED);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex gap-1 border-b px-4 pt-4">
        {(
          [
            ["mine", ImageIcon],
            ["free", Globe],
          ] as const
        ).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold",
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tr(`tab_${key}`)}
          </button>
        ))}
      </div>

      {tab === "mine" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted-foreground">{tr("upload_help")}</p>
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file);
              }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading || loadingMine} className="shrink-0">
              {uploading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Upload className="me-2 h-4 w-4" />}
              {tr("upload")}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {loadingMine ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : media.length === 0 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-14 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Upload className="h-6 w-6" />
                {tr("empty")}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {media.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelect(m.file_url)}
                    className="group relative aspect-square overflow-hidden rounded-lg border hover:border-primary"
                  >
                    <img src={m.file_url} alt={m.filename || ""} className="h-full w-full object-cover" loading="lazy" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Check className="h-7 w-7 text-white" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "free" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <form
            className="flex gap-2 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch();
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr("search")} className="ps-9" />
            </div>
            <Button type="submit" variant="outline" disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("search_button")}
            </Button>
          </form>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.full)}
                  className="group relative aspect-square overflow-hidden rounded-lg border hover:border-primary"
                >
                  <img src={p.thumb} alt={p.alt} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Check className="h-7 w-7 text-white" />
                  </span>
                </button>
              ))}
            </div>
            <p className="pt-4 text-center text-[11px] text-muted-foreground">{tr("credit")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
