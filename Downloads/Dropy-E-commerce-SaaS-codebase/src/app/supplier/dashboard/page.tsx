"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  DollarSign, 
  Truck, 
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingShipments: number;
}

export default function SupplierDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: supplierProfile } = await supabase
        .from("supplier_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!supplierProfile) {
        router.replace("/supplier/signup");
        return;
      }

      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id);

      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id);

      const { data: revenueData } = await supabase
        .from("payments")
        .select("supplier_amount")
        .eq("supplier_id", user.id)
        .eq("status", "completed");

      const totalRevenue = revenueData?.reduce((sum, p) => sum + Number(p.supplier_amount || 0), 0) || 0;

      const { count: pendingShipments } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id)
        .in("status", ["confirmed", "preparing"]);

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        pendingShipments: pendingShipments || 0,
      });

      setLoading(false);
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Chargement de votre inventaire fournisseur...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Produits", value: stats.totalProducts.toString(), icon: Package, color: "bg-primary" },
    { title: "Commandes", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "bg-primary" },
    { title: "Revenus", value: `${stats.totalRevenue.toFixed(0)} TND`, icon: DollarSign, color: "bg-primary" },
    { title: "À expédier", value: stats.pendingShipments.toString(), icon: Truck, color: "bg-primary" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">Dashboard Fournisseur</h1>
          <p className="text-muted-foreground tracking-tight">Gérez vos produits et commandes</p>
        </div>
        <Link href="/supplier/products/new">
          <Button className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-none hover:opacity-90">
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 hover:shadow-xl transition-all group overflow-hidden bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">{stat.title}</p>
                    <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/10`}>
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/supplier/products/new" className="block group">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center group-hover:shadow-lg transition-all">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold group-hover:text-primary transition-colors">Ajouter un produit</p>
                  <p className="text-xs text-muted-foreground">Proposez vos produits aux vendeurs</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </Link>
            <Link href="/supplier/orders" className="block group">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center group-hover:shadow-lg transition-all">
                  <ShoppingCart className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold group-hover:text-primary transition-colors">Voir les commandes</p>
                  <p className="text-xs text-muted-foreground">Gérez vos commandes entrantes</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Clock className="w-5 h-5 text-primary" />
              À expédier ({stats.pendingShipments})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pendingShipments === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune commande à expédier</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-primary/5 rounded-3xl border border-primary/20">
                <p className="text-5xl font-black text-primary">{stats.pendingShipments}</p>
                <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">commandes en attente</p>
                <Link href="/supplier/orders?status=pending">
                  <Button className="mt-4 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors" variant="outline">
                    Voir les commandes
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
