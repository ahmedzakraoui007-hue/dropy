"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Store, 
  Package, 
  UserCheck,
  ShoppingBag,
  Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalSuppliers: number;
  totalCreators: number;
  newUsersThisMonth: number;
  pendingRequests: number;
  approvedSellers: number;
  onlineStores: number;
  totalOrders: number;
  ordersThisMonth: number;
  recentUsers: any[];
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      
      const { data: users } = await supabase.from("profiles").select("role, status, created_at");
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      
      const totalUsers = users?.length || 0;
      const totalSellers = users?.filter(u => u.role === 'seller').length || 0;
      const totalSuppliers = users?.filter(u => u.role === 'supplier').length || 0;
      const totalCreators = users?.filter(u => u.role === 'creator').length || 0;
      const newUsersThisMonth = users?.filter(u => u.created_at >= monthStart).length || 0;
      const pendingRequests = users?.filter(u => u.role !== 'admin' && (!u.status || u.status === 'pending')).length || 0;
      const approvedSellers = users?.filter(u => u.role === 'seller' && (u.status === 'approved' || u.status === 'active')).length || 0;

      const [onlineStoresRes, ordersRes, monthOrdersRes] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("store_orders").select("id", { count: "exact", head: true }),
        supabase.from("store_orders").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
      ]);

      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalUsers,
        totalSellers,
        totalSuppliers,
        totalCreators,
        newUsersThisMonth,
        pendingRequests,
        approvedSellers,
        onlineStores: onlineStoresRes.count || 0,
        totalOrders: ordersRes.count || 0,
        ordersThisMonth: monthOrdersRes.count || 0,
        recentUsers: recentUsers || []
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-muted rounded-xl"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Utilisateurs Totaux",
      value: stats?.totalUsers || 0,
      description: `+${stats?.newUsersThisMonth || 0} ce mois`,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/users",
    },
    {
      title: "Demandes en attente",
      value: stats?.pendingRequests || 0,
      description: "Comptes à approuver",
      icon: UserCheck,
      color: (stats?.pendingRequests || 0) > 0 ? "text-amber-600" : "text-primary",
      bg: (stats?.pendingRequests || 0) > 0 ? "bg-amber-500/10" : "bg-primary/10",
      href: "/admin/users",
    },
    {
      title: "Vendeurs approuvés",
      value: stats?.approvedSellers || 0,
      description: `${stats?.onlineStores || 0} boutiques en ligne`,
      icon: Store,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/sellers",
    },
    {
      title: "Commandes",
      value: stats?.totalOrders || 0,
      description: `${stats?.ordersThisMonth || 0} ce mois`,
      icon: ShoppingBag,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/shipments",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">Centre de Contrôle</h1>
        <p className="text-muted-foreground tracking-tight">Vue d&apos;ensemble de l&apos;écosystème Dropy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.title} href={kpi.href} className="block">
          <Card className="border-border/50 bg-card shadow-sm group hover:border-primary/50 transition-colors h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${kpi.bg} group-hover:bg-primary group-hover:text-primary-foreground transition-colors`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color} group-hover:text-primary-foreground transition-colors`} />
                </div>
                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider bg-muted text-muted-foreground">
                  {kpi.description}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{kpi.title}</p>
                <p className="text-3xl font-black tracking-tighter">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Utilisateurs Récents</CardTitle>
              <CardDescription>Dernières inscriptions sur la plateforme</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px]" asChild>
              <Link href="/admin/users">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Utilisateur</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Rôle</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Plan</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentUsers.map((user) => (
                  <TableRow key={user.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-border">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold">{user.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-black uppercase tracking-widest ${
                        user.subscription_plan === 'enterprise' ? "bg-primary text-primary-foreground" :
                        user.subscription_plan === 'pro' ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {user.subscription_plan || 'starter'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-medium text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Distribution</CardTitle>
            <CardDescription>Répartition de l&apos;écosystème</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "Vendeurs", count: stats?.totalSellers, color: "bg-primary", icon: ShoppingBag },
              { label: "Fournisseurs", count: stats?.totalSuppliers, color: "bg-primary/60", icon: Package },
              { label: "Créateurs", count: stats?.totalCreators, color: "bg-primary/30", icon: Camera },
              { label: "Admins", count: stats?.totalUsers ? stats.totalUsers - (stats.totalSellers + stats.totalSuppliers + stats.totalCreators) : 0, color: "bg-muted", icon: Users }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color} text-primary-foreground`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold group-hover:text-primary transition-colors">{item.label}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black">{item.count}</span>
                  <div className="w-24 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`} 
                      style={{ width: `${(item.count || 0) / (stats?.totalUsers || 1) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Marketplace Statut</h4>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30">24 En cours</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Approbation</span>
                  <span className="text-primary">12</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Litiges</span>
                  <span className="text-destructive">2</span>
                </div>
              </div>
              <Button className="w-full mt-6 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest h-10 shadow-lg shadow-primary/10">
                Détails Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
