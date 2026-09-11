"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Store, 
  Users,
  MoreHorizontal,
  Mail,
  ExternalLink,
  Ban,
  CheckCircle,
  TrendingUp,
  ShoppingBag
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface SellerProfile {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
  avatar_url: string | null;
  stores: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  }[];
}

export default function SellersManagement() {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSellers = async () => {
    setLoading(true);
    const supabase = createClient();
    
    let query = supabase
      .from("profiles")
      .select(`
        *,
        stores (
          id,
          name,
          slug,
          is_active
        )
      `)
      .eq("role", "seller");
    
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des vendeurs");
    } else {
      setSellers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSellers();
  }, [searchTerm]);

  const updateStatus = async (userId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);
    
    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      toast.success(newStatus === 'suspended' ? "Vendeur suspendu" : "Vendeur activé");
      fetchSellers();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500">Vendeurs & Boutiques</h1>
          <p className="text-muted-foreground">Gérez les vendeurs et surveillez leurs boutiques actives.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vendeurs</p>
                <h3 className="text-2xl font-bold">{sellers.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Boutiques Actives</p>
                  <h3 className="text-2xl font-bold">
                    {sellers.reduce((acc, s) => acc + s.stores.filter(st => st.is_active).length, 0)}
                  </h3>
                </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <h3 className="text-2xl font-bold">
                   {sellers.filter(s => s.status === 'pending').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un vendeur..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Vendeur</TableHead>
                  <TableHead>Boutiques</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d&apos;inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/50"></TableCell>
                    </TableRow>
                  ))
                ) : sellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun vendeur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  sellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={seller.avatar_url || ""} />
                            <AvatarFallback>{seller.full_name?.charAt(0) || "V"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{seller.full_name}</span>
                            <span className="text-xs text-muted-foreground">{seller.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {seller.stores.length > 0 ? (
                            seller.stores.map((store) => (
                              <Badge key={store.id} variant="secondary" className="text-[10px] font-normal">
                                {store.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucune boutique</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={seller.status === 'suspended' ? "destructive" : "default"}
                          className={seller.status === 'active' || !seller.status ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : ""}
                        >
                          {seller.status === 'suspended' ? 'Suspendu' : 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(seller.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Actions Vendeur</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.open(`mailto:${seller.email}`)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Contacter
                            </DropdownMenuItem>
                            {seller.stores.length > 0 && (
                              <DropdownMenuItem onClick={() => window.open(`/preview/${seller.stores[0].slug}`, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Voir la boutique principale
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {seller.status === 'suspended' ? (
                              <DropdownMenuItem onClick={() => updateStatus(seller.id, 'active')} className="text-emerald-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Réactiver le compte
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => updateStatus(seller.id, 'suspended')} className="text-red-600">
                                <Ban className="w-4 h-4 mr-2" />
                                Suspendre le compte
                              </DropdownMenuItem>
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
