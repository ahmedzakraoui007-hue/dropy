"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Brief {
  id: string;
  title: string;
  description: string;
  content_type: string;
  status: string;
  budget: number;
  created_at: string;
  store_id: string;
}

export default function ContentModeration() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBriefs = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("content_briefs").select("*");

    if (searchTerm) {
      query = query.ilike("title", `%${searchTerm}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des briefs");
    } else {
      setBriefs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBriefs();
  }, [searchTerm]);

  const deleteBrief = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce brief ?")) return;
    
    const supabase = createClient();
    const { error } = await supabase.from("content_briefs").delete().eq("id", id);
    
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Brief supprimé");
      fetchBriefs();
    }
  };

  const updateBriefStatus = async (id: string, status: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("content_briefs").update({ status }).eq("id", id);
    
    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success(`Statut mis à jour: ${status}`);
      fetchBriefs();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modération du Contenu</h1>
          <p className="text-muted-foreground">Surveillez et modérez les briefs publiés sur le Marketplace.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="h-10 px-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
            <AlertCircle className="w-4 h-4 mr-2" />
            12 Signalements
          </Badge>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un brief..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Tous</Button>
              <Button variant="outline" size="sm">En attente</Button>
              <Button variant="outline" size="sm">Publiés</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brief</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/50"></TableCell>
                    </TableRow>
                  ))
                ) : briefs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun brief trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  briefs.map((brief) => (
                    <TableRow key={brief.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{brief.title}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[250px]">{brief.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {brief.content_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {brief.budget} TND
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          brief.status === 'published' ? "bg-emerald-500" :
                          brief.status === 'draft' ? "bg-slate-500" : "bg-orange-500"
                        }>
                          {brief.status}
                        </Badge>
                      </TableCell>
<TableCell className="text-xs text-muted-foreground">
  {formatDate(brief.created_at)}
</TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{brief.title}</DialogTitle>
                                <DialogDescription>Détails complets du brief</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <h4 className="text-sm font-bold mb-1">Description</h4>
                                  <p className="text-sm text-muted-foreground">{brief.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-bold mb-1">Type</h4>
                                    <p className="text-sm">{brief.content_type}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold mb-1">Budget</h4>
                                    <p className="text-sm">{brief.budget} TND</p>
                                  </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => updateBriefStatus(brief.id, 'draft')}>
                                    Mettre en brouillon
                                  </Button>
                                  <Button variant="default" size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => updateBriefStatus(brief.id, 'published')}>
                                    Approuver
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteBrief(brief.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
