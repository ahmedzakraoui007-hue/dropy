"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical,
  ChevronRight,
  MessageSquare,
  FileText,
  Video,
  Camera,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function BriefsPage() {
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadBriefs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // First get store_id
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("seller_id", user?.id)
        .single();

      if (!store) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("content_briefs")
        .select(`
          *,
          applications:content_applications(count)
        `)
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erreur lors du chargement des briefs");
      } else {
        setBriefs(data || []);
      }
      setLoading(false);
    }
    loadBriefs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="outline">Brouillon</Badge>;
      case "published": return <Badge className="bg-emerald-500">Publié</Badge>;
      case "in_progress": return <Badge className="bg-blue-500">En cours</Badge>;
      case "completed": return <Badge className="bg-purple-500">Terminé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBriefs = briefs.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.products?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes Briefs Créatifs</h1>
          <p className="text-muted-foreground">Gérez vos demandes de contenu et collaborez avec des créateurs.</p>
        </div>
        <Link href="/seller/creators/briefs/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-green-600 gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Brief
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un brief..." 
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredBriefs.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun brief trouvé</h3>
            <p className="text-muted-foreground mb-6">Commencez par créer votre premier brief créatif.</p>
            <Link href="/seller/creators/briefs/new">
              <Button variant="outline">Créer un brief</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBriefs.map((brief) => (
            <Card key={brief.id} className="overflow-hidden border-border/50 hover:border-emerald-500/50 transition-colors">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    <img 
                      src={brief.products?.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop"} 
                      className="w-full h-full object-cover"
                      alt={brief.products?.name}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold truncate">{brief.title}</h3>
                      {getStatusBadge(brief.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {brief.products?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        {brief.content_type === 'video' ? <Video className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        {brief.content_type === 'video' ? 'Vidéo / UGC' : 'Photos / Packshot'}
                      </span>
<span className="flex items-center gap-1">
  <Clock className="w-4 h-4" />
  {formatDate(brief.created_at)}
</span>

                    </div>
                  </div>

                  <div className="flex items-center gap-8 md:px-8 md:border-x border-border/50">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{brief.applications?.[0]?.count || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Candidatures</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{brief.budget} <span className="text-sm font-normal text-muted-foreground">TND</span></p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Budget</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/seller/creators/briefs/${brief.id}`}>
                      <Button variant="outline" size="sm">Gérer</Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
