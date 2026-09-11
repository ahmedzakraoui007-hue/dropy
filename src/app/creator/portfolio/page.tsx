"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  ExternalLink,
  Loader2,
  LayoutGrid,
  Settings,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PortfolioPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    type: "image",
    category: "Product Photography",
    thumbnail_url: "",
    content_url: ""
  });

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function loadPortfolio() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("creator_portfolio")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le portfolio",
        variant: "destructive"
      });
    } else if (data) {
      setPortfolio(data);
    }
    setLoading(false);
  }

  async function handleAddProject() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("creator_portfolio")
      .insert([{
        ...newProject,
        creator_id: user.id
      }])
      .select();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le projet",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: "Projet ajouté au portfolio",
      });
      setIsAdding(false);
      setNewProject({
        title: "",
        description: "",
        type: "image",
        category: "Product Photography",
        thumbnail_url: "",
        content_url: ""
      });
      loadPortfolio();
    }
  }

  async function handleDeleteProject(id: string) {
    setIsDeleting(id);
    const { error } = await supabase
      .from("creator_portfolio")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: "Projet supprimé",
      });
      loadPortfolio();
    }
    setIsDeleting(null);
  }

  if (loading && portfolio.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">Mon Portfolio</h1>
          <p className="text-muted-foreground">Présentez vos meilleures réalisations aux vendeurs.</p>
        </div>
          <div className="flex gap-2">
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter un projet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un projet</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle réalisation à votre portfolio.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Titre du projet</Label>
                    <Input 
                      id="title" 
                      placeholder="ex: Shooting Chaussures Nike" 
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select 
                        value={newProject.type} 
                        onValueChange={(v) => setNewProject({...newProject, type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Vidéo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Catégorie</Label>
                      <Select 
                        value={newProject.category} 
                        onValueChange={(v) => setNewProject({...newProject, category: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Product Photography">Photographie Produit</SelectItem>
                          <SelectItem value="UGC Video">Vidéo UGC</SelectItem>
                          <SelectItem value="Video Ad">Publicité Vidéo</SelectItem>
                          <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnail">URL de l'image / Miniature</Label>
                    <Input 
                      id="thumbnail" 
                      placeholder="https://..." 
                      value={newProject.thumbnail_url}
                      onChange={(e) => setNewProject({...newProject, thumbnail_url: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Décrivez votre travail..." 
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>Annuler</Button>
                  <Button 
                    onClick={handleAddProject}
                    className="bg-primary text-primary-foreground"
                    disabled={!newProject.title || !newProject.thumbnail_url}
                  >
                    Ajouter au portfolio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">Votre portfolio est vide</h3>
              <p className="text-muted-foreground mb-6">Ajoutez vos premières réalisations pour attirer les vendeurs.</p>
              <Button 
                className="bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => setIsAdding(true)}
              >
                Ajouter mon premier projet
              </Button>
            </div>
          ) : (
            portfolio.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all bg-card">
                <div className="aspect-video relative bg-muted">
                  {item.thumbnail_url ? (
                    <img 
                      src={item.thumbnail_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'video' ? <Video className="w-12 h-12 opacity-20" /> : <ImageIcon className="w-12 h-12 opacity-20" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    <Button size="sm" variant="outline" className="gap-2 bg-background" asChild>
                      <a href={item.content_url || item.thumbnail_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Voir
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-9 w-9 p-0"
                      onClick={() => handleDeleteProject(item.id)}
                      disabled={isDeleting === item.id}
                    >
                      {isDeleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold truncate max-w-[200px]">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{item.type} • {item.category || 'Général'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {item.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }
