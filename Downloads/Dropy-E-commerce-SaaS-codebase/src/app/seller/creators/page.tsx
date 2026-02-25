"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Camera, 
  Video, 
  CheckCircle2,
  ChevronRight,
  Heart,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface Creator {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  specialty: string[];
  location: string;
  rating: number;
  review_count: number;
  starting_price: number;
  portfolio_preview: string[];
}

export default function CreatorMarketplace() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  useEffect(() => {
    async function loadCreators() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .eq("status", "active");

      if (data) {
        const mappedCreators = data.map((c: any) => ({
          ...c,
          full_name: c.profile.full_name,
          avatar_url: c.profile.avatar_url,
        }));
        setCreators(mappedCreators);
      }
      setLoading(false);
    }
    loadCreators();
  }, []);

  const filteredCreators = creators.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || 
                         c.bio?.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || c.specialty.includes(specialtyFilter);
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">Content Marketplace</h1>
          <p className="text-muted-foreground mt-2">Engagez les meilleurs talents tunisiens pour vos produits.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/seller/creators/briefs">
            <Button variant="outline">Mes Briefs</Button>
          </Link>
          <Link href="/seller/creators/briefs/new">
            <Button className="bg-gradient-to-r from-emerald-500 to-green-600">
              Lancer un projet
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom, bio, ville..." 
                className="pl-10 h-12 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl">
                <SelectValue placeholder="Spécialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les spécialités</SelectItem>
                <SelectItem value="Photography">Photographie</SelectItem>
                <SelectItem value="Videography">Vidéo</SelectItem>
                <SelectItem value="UGC">UGC (Contenu utilisateur)</SelectItem>
                <SelectItem value="Modeling">Mannequinat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
              ))
            ) : filteredCreators.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">Aucun créateur trouvé</p>
                <p className="text-muted-foreground">Essayez d&apos;ajuster vos filtres.</p>
              </div>
            ) : (
              filteredCreators.map((creator) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="overflow-hidden border-border/50 hover:border-emerald-500/50 hover:shadow-xl transition-all group">
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img 
                        src={creator.portfolio_preview?.[0] || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500&h=300&fit=crop"} 
                        alt="Portfolio"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3">
                        <Button size="icon" variant="secondary" className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {creator.specialty.map((s, i) => (
                          <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border-2 border-background shadow-sm">
                            <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-bold flex items-center gap-1">
                              {creator.full_name}
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {creator.location}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {creator.rating}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{creator.review_count} avis</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                        {creator.bio}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">À partir de</p>
                          <p className="text-lg font-extrabold text-emerald-600">{creator.starting_price} TND</p>
                        </div>
                        <Link href={`/seller/creators/${creator.id}`}>
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 rounded-lg group/btn">
                            Voir le profil
                            <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 border-0 text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Besoin d&apos;aide ?</h3>
              <p className="text-white/80 text-sm mb-4">
                Nos experts peuvent vous aider à trouver le meilleur créateur pour votre projet.
              </p>
              <Button className="w-full bg-white text-emerald-600 hover:bg-white/90">
                Parler à un conseiller
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Catégories populaires</h3>
              <div className="space-y-2">
                {[
                  { label: "UGC (Vidéos TikTok/Reels)", icon: Video },
                  { label: "Shooting Packshot", icon: Camera },
                  { label: "Mannequinat Mode", icon: CheckCircle2 },
                  { label: "Montage Vidéo", icon: ExternalLink },
                ].map((cat, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-sm group">
                    <span className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4 text-emerald-500" />
                      {cat.label}
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Comment ça marche ?</h3>
              <div className="space-y-4">
                {[
                  { step: 1, text: "Choisissez un créateur ou postez un brief." },
                  { step: 2, text: "Envoyez vos produits au créateur." },
                  { step: 3, text: "Recevez et validez votre contenu." },
                  { step: 4, text: "Le paiement est libéré au créateur." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
