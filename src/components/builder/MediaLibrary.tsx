"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  X,
  Globe,
  Grid,
  List,
  Download,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [unsplashPhotos, setUnsplashPhotos] = useState<any[]>([]);
  const [myMedia, setMyMedia] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("unsplash");
  const [uploading, setUploading] = useState(false);

  async function searchUnsplash() {
    if (!search) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/media/unsplash/search?query=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.setup_required) {
        toast.info(data.error, {
          duration: 5000,
          action: {
            label: "Aide",
            onClick: () => window.open("https://unsplash.com/developers", "_blank")
          }
        });
        return;
      }
      if (data.error) throw new Error(data.error);
      setUnsplashPhotos(data.results || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyMedia() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement de vos médias");
    } else {
      setMyMedia(data || []);
    }
  }

  useEffect(() => {
    if (activeTab === "my-media") {
      loadMyMedia();
    }
  }, [activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const fileName = `${user?.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(data.path);

      // Save to media_library table
      const { error: dbError } = await supabase
        .from("media_library")
        .insert({
          file_url: publicUrl,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          source: 'upload'
        });

      if (dbError) throw dbError;

      toast.success("Image uploadée !");
      loadMyMedia();
      setActiveTab("my-media");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveUnsplashToLibrary = async (photo: any) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("media_library")
        .insert({
          file_url: photo.urls.regular,
          filename: `unsplash-${photo.id}`,
          file_type: 'image/jpeg',
          source: 'unsplash',
          tags: photo.tags?.map((t: any) => t.title)
        });

      if (error) throw error;
      onSelect(photo.urls.regular);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Bibliothèque Médias
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-12 gap-6 p-0">
            <TabsTrigger 
              value="unsplash" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
            >
              <Globe className="w-4 h-4 mr-2" />
              Unsplash
            </TabsTrigger>
            <TabsTrigger 
              value="my-media" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Mes Médias
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="unsplash" className="flex-1 flex flex-col m-0 overflow-hidden">
          <div className="p-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher des images gratuites..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUnsplash()}
              />
            </div>
            <Button onClick={searchUnsplash} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
              {unsplashPhotos.map((photo) => (
                <div 
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-all cursor-pointer"
                  onClick={() => saveUnsplashToLibrary(photo)}
                >
                  <img 
                    src={photo.urls.small} 
                    alt={photo.alt_description}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" className="gap-2">
                      <Download className="w-4 h-4" />
                      Sélectionner
                    </Button>
                  </div>
                </div>
              ))}
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
              {!loading && unsplashPhotos.length === 0 && search && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  Aucun résultat pour &quot;{search}&quot;
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="my-media" className="flex-1 flex flex-col m-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {myMedia.length} fichiers uploadés
            </p>
            <div className="relative">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" className="gap-2 pointer-events-none" disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Uploader
                </Button>
              </Label>
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
              {myMedia.map((media) => (
                <div 
                  key={media.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-all cursor-pointer"
                  onClick={() => onSelect(media.file_url)}
                >
                  <img 
                    src={media.file_url} 
                    alt={media.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                </div>
              ))}
              {myMedia.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  Vous n&apos;avez pas encore de médias.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
