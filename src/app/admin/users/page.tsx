"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  UserX, 
  UserCheck, 
  Mail,
  ArrowUpDown,
  Download
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

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  subscription_plan: string;
  created_at: string;
  avatar_url: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchUsers = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from("profiles").select("*");
      
      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }


    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

    useEffect(() => {
      fetchUsers();
    }, [roleFilter, statusFilter, searchTerm]);


  const updateUserRole = async (userId: string, newRole: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    
    if (error) {
      toast.error("Erreur lors de la mise à jour du rôle");
    } else {
      toast.success(`Rôle mis à jour: ${newRole}`);
      fetchUsers();
    }
  };

    const updateUserStatus = async (userId: string, newStatus: string) => {
      try {
        const response = await fetch("/api/admin/users/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, status: newStatus }),
        });

        if (!response.ok) throw new Error("Erreur API");

        const statusMessages: Record<string, string> = {
          active: "Utilisateur activé & Email envoyé",
          rejected: "Demande refusée & Email envoyé",
          suspended: "Utilisateur suspendu",
          approved: "Utilisateur approuvé & Email envoyé"
        };
        toast.success(statusMessages[newStatus] || "Statut mis à jour");
        fetchUsers();
      } catch (error) {
        toast.error("Erreur lors de la mise à jour du statut");
      }
    };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Administrez les comptes et les rôles de la plateforme.</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600">
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom ou email..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-10 px-4 flex gap-2 items-center cursor-pointer hover:bg-muted" onClick={() => setRoleFilter('all')}>
                Tous
              </Badge>
              <Badge variant="outline" className="h-10 px-4 flex gap-2 items-center cursor-pointer hover:bg-muted" onClick={() => setRoleFilter('seller')}>
                Vendeurs
              </Badge>
              <Badge variant="outline" className="h-10 px-4 flex gap-2 items-center cursor-pointer hover:bg-muted" onClick={() => setRoleFilter('supplier')}>
                Fournisseurs
              </Badge>
              <Badge variant="outline" className="h-10 px-4 flex gap-2 items-center cursor-pointer hover:bg-muted" onClick={() => setRoleFilter('creator')}>
                Créateurs
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Date d&apos;inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/50"></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback>{user.full_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{user.full_name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize font-normal">
                          {user.role}
                        </Badge>
                      </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === 'suspended' || user.status === 'rejected' ? "destructive" : "default"}
                            className={
                              user.status === 'active' || user.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : 
                              user.status === 'email_verified' ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" :
                              user.status === 'pending' ? "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20" : ""
                            }
                          >
                            {user.status === 'suspended' ? 'Suspendu' : 
                             user.status === 'active' || user.status === 'approved' ? 'Actif' :
                             user.status === 'email_verified' ? 'En attente validation' :
                             user.status === 'pending' ? 'En attente email' :
                             user.status === 'rejected' ? 'Refusé' : user.status}
                          </Badge>
                        </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={
                          user.subscription_plan === 'enterprise' ? "border-purple-500 text-purple-500" :
                          user.subscription_plan === 'pro' ? "border-blue-500 text-blue-500" : ""
                        }>
                          {user.subscription_plan || 'starter'}
                        </Badge>
                      </TableCell>
<TableCell className="text-sm text-muted-foreground">
  {formatDate(user.created_at)}
</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Contacter
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1">Changer le rôle</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => updateUserRole(user.id, 'seller')}>
                              Vendeur
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserRole(user.id, 'supplier')}>
                              Fournisseur
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserRole(user.id, 'creator')}>
                              Créateur
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserRole(user.id, 'admin')} className="text-red-500">
                              <Shield className="w-4 h-4 mr-2" />
                              Promouvoir Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                              {user.status === 'email_verified' && (
                                <>
                                  <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'active')} className="text-emerald-600 font-bold">
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Accepter la demande
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'rejected')} className="text-red-600">
                                    <UserX className="w-4 h-4 mr-2" />
                                    Refuser la demande
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {user.status === 'suspended' ? (
                                <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'active')} className="text-emerald-600">
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Réactiver
                                </DropdownMenuItem>
                              ) : (
                                user.status !== 'email_verified' && user.status !== 'pending' && (
                                  <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'suspended')} className="text-red-600">
                                    <UserX className="w-4 h-4 mr-2" />
                                    Suspendre
                                  </DropdownMenuItem>
                                )
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
