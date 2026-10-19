"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Image as ImageIcon, Instagram, Loader2, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { portfolioCategoryLabel, isVideoUrl } from "@/lib/portfolio";

export function CreatorPortfolioDialog({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    setLoading(true);
    Promise.all([
      supabase.from("creator_portfolio").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false }),
      supabase
        .from("creator_profiles")
        .select("bio, city, instagram_handle, instagram_username, tiktok_handle, total_projects")
        .eq("user_id", creatorId)
        .maybeSingle(),
    ]).then(([portfolio, cp]) => {
      setItems(portfolio.data || []);
      setProfile(cp.data);
      setLoading(false);
    });
  }, [open, creatorId]);

  const instagram = profile?.instagram_handle || profile?.instagram_username;

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Voir le portfolio
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Portfolio de {creatorName}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {profile?.city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>
                )}
                {instagram && (
                  <a
                    href={`https://instagram.com/${String(instagram).replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Instagram className="w-3 h-3" />@{String(instagram).replace(/^@/, "")}
                  </a>
                )}
                {profile?.tiktok_handle && (
                  <a
                    href={`https://www.tiktok.com/@${String(profile.tiktok_handle).replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    TikTok @{String(profile.tiktok_handle).replace(/^@/, "")}
                  </a>
                )}
                <span>{profile?.total_projects || 0} mission(s) Dropy terminée(s)</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          {profile?.bio && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Ce créateur n&apos;a pas encore ajouté de réalisations.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => {
                const media = item.content_url || item.thumbnail_url;
                const video = item.type === "video";
                return (
                  <div key={item.id} className="rounded-xl border overflow-hidden">
                    <div className="aspect-video bg-muted">
                      {video && isVideoUrl(media) ? (
                        <video src={media} className="w-full h-full object-cover" controls preload="metadata" />
                      ) : item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {video ? <Video className="w-10 h-10 opacity-20" /> : <ImageIcon className="w-10 h-10 opacity-20" />}
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{item.title}</p>
                        {media && (
                          <a href={media} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{portfolioCategoryLabel(item.category)}</p>
                      {item.description && <p className="text-xs text-muted-foreground line-clamp-3">{item.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
