"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Package, 
  Users,
  MoreHorizontal,
  Mail,
  Ban,
  CheckCircle,
  Truck,
  ShoppingCart,
  Star
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

interface SupplierProfile {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
  avatar_url: string | null;
  products_count: number;
}

export default function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSuppliers = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Pour simplifier on récupère les profils et on comptera les produits ensuite ou via une vue
    // Ici on fait une requête simple
    let query = supabase
      .from("profiles")
      .select(`*`)
      .eq("role", "supplier");
    
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data: profiles, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des fournisseurs");
    } else if (profiles) {
      // On récupère le nombre de produits pour chaque fournisseur
      const suppliersWithCounts = await Promise.all(profiles.map(async (profile) => {
        const { count } = await supabase
          .from("products")
          .select("*", { count: 'exact', head: true })
          .eq("supplier_id", profile.id);
        
        return {
          ...profile,
          products_count: count || 0
        };
      }));
      setSuppliers(suppliersWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
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
      toast.success(newStatus === 'suspended' ? "Fournisseur suspendu" : "Fournisseur activé");
      fetchSuppliers();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500">Fournisseurs</h1>
          <p className="text-muted-foreground">Gérez les partenaires logistiques et fournisseurs de produits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fournisseurs</p>
                <h3 className="text-2xl font-bold">{suppliers.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <h3 className="text-2xl font-bold">
                  {suppliers.reduce((acc, s) => acc + s.products_count, 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Note Moyenne</p>
                <h3 className="text-2xl font-bold">4.8/5</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
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
                placeholder="Rechercher un fournisseur..." 
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
                  <TableHead className="w-[300px]">Fournisseur</TableHead>
                  <TableHead>Produits au catalogue</TableHead>
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
                ) : suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun fournisseur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={supplier.avatar_url || ""} />
                            <AvatarFallback>{supplier.full_name?.charAt(0) || "F"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{supplier.full_name}</span>
                            <span className="text-xs text-muted-foreground">{supplier.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{supplier.products_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={supplier.status === 'suspended' ? "destructive" : "default"}
                          className={supplier.status === 'active' || !supplier.status ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : ""}
                        >
                          {supplier.status === 'suspended' ? 'Suspendu' : 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(supplier.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Actions Fournisseur</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.open(`mailto:${supplier.email}`)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Contacter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/admin/products?supplier=${supplier.id}`)}>
                              <Package className="w-4 h-4 mr-2" />
                              Voir les produits
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {supplier.status === 'suspended' ? (
                              <DropdownMenuItem onClick={() => updateStatus(supplier.id, 'active')} className="text-emerald-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Réactiver le compte
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => updateStatus(supplier.id, 'suspended')} className="text-red-600">
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
