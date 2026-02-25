"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  MessageSquare, 
  AlertCircle,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Dispute {
  id: string;
  brief_id: string;
  opened_by: string;
  reason: string;
  status: string;
  created_at: string;
  opened_by_profile?: { full_name: string };
  content_briefs?: {
    title: string;
    selected_creator_id: string;
    creator_profile?: { full_name: string };
    stores: {
      name: string;
      seller_id: string;
      seller_profile?: { full_name: string };
    };
  };
}

export default function SupportManagement() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDisputes = async () => {
    setLoading(true);
    const supabase = createClient();
    
    let query = supabase
      .from("content_disputes")
      .select(`
        *,
        opened_by_profile:profiles!opened_by(full_name),
        content_briefs!inner (
          id,
          title,
          selected_creator_id,
          creator_profile:profiles!selected_creator_id(full_name),
          stores!inner (
            id,
            name,
            seller_id,
            seller_profile:profiles!seller_id(full_name)
          )
        )
      `);
    
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des litiges");
    } else {
      setDisputes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const resolveDispute = async (id: string, resolution: 'resolved' | 'cancelled') => {
    const supabase = createClient();
    const { error } = await supabase
      .from("content_disputes")
      .update({ status: resolution })
      .eq("id", id);
    
    if (error) {
      toast.error("Erreur lors de la résolution du litige");
    } else {
      toast.success("Litige mis à jour");
      fetchDisputes();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500">Support & Litiges</h1>
          <p className="text-muted-foreground">Gérez les réclamations et résolvez les conflits entre utilisateurs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Litiges Ouverts</p>
                <h3 className="text-2xl font-bold text-red-500">
                  {disputes.filter(d => d.status === 'open' || d.status === 'pending').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente d&apos;action</p>
                <h3 className="text-2xl font-bold">
                  {disputes.filter(d => d.status === 'pending').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Résolus (30j)</p>
                <h3 className="text-2xl font-bold text-emerald-500">
                  {disputes.filter(d => d.status === 'resolved').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Tous
              </Button>
              <Button 
                variant={statusFilter === 'open' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('open')}
              >
                Ouverts
              </Button>
              <Button 
                variant={statusFilter === 'resolved' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('resolved')}
              >
                Résolus
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Litige ID</TableHead>
                  <TableHead>Parties prenantes</TableHead>
                  <TableHead>Raison</TableHead>
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
                ) : disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun litige trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-xs">
                        #{dispute.id.slice(0, 8)}
                      </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[9px] h-4">VENDEUR</Badge>
                              <span>{dispute.content_briefs?.stores?.seller_profile?.full_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[9px] h-4 border-emerald-500 text-emerald-500">CRÉATEUR</Badge>
                              <span>{dispute.content_briefs?.creator_profile?.full_name}</span>
                            </div>
                          </div>
                        </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {dispute.reason}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={dispute.status === 'open' ? "destructive" : dispute.status === 'resolved' ? "default" : "secondary"}
                          className={dispute.status === 'resolved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""}
                        >
                          {dispute.status === 'open' ? 'Ouvert' : dispute.status === 'resolved' ? 'Résolu' : 'Annulé'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(dispute.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Gestion du litige</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.open(`/admin/content/briefs/${dispute.brief_id}`)}>
                              <ShieldAlert className="w-4 h-4 mr-2" />
                              Voir la mission associée
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {dispute.status === 'open' && (
                              <>
                                <DropdownMenuItem onClick={() => resolveDispute(dispute.id, 'resolved')} className="text-emerald-600">
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Marquer comme résolu
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => resolveDispute(dispute.id, 'cancelled')} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Annuler la plainte
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
