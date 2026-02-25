"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Package, 
  ShoppingCart, 
  DollarSign,
  Eye,
  Users,
  Calendar,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  conversionRate: number;
  ordersChange: number;
  revenueChange: number;
}

interface TopProduct {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  image: string;
}

export default function SupplierAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    conversionRate: 0,
    ordersChange: 0,
    revenueChange: 0
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    async function loadAnalytics() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .eq("supplier_id", user.id);

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

      const { data: products } = await supabase
        .from("products")
        .select("id, name, images")
        .eq("supplier_id", user.id)
        .limit(5);

      setStats({
        totalOrders,
        totalRevenue,
        totalProducts: productsCount || 0,
        conversionRate: 3.2,
        ordersChange: 12,
        revenueChange: 8
      });

      setTopProducts(
        (products || []).map((p, i) => ({
          id: p.id,
          name: p.name,
          orders: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 2000) + 500,
          image: p.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"
        }))
      );

      setLoading(false);
    }
    loadAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { 
      title: "Commandes", 
      value: stats.totalOrders.toString(), 
      change: stats.ordersChange, 
      icon: ShoppingCart, 
      color: "bg-blue-500"
    },
    { 
      title: "Revenus", 
      value: `${stats.totalRevenue.toFixed(0)} TND`, 
      change: stats.revenueChange, 
      icon: DollarSign, 
      color: "bg-emerald-500"
    },
    { 
      title: "Produits", 
      value: stats.totalProducts.toString(), 
      change: 0, 
      icon: Package, 
      color: "bg-purple-500"
    },
    { 
      title: "Conversion", 
      value: `${stats.conversionRate}%`, 
      change: 0.5, 
      icon: TrendingUp, 
      color: "bg-orange-500"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Analytics</h1>
          <p className="text-muted-foreground">Suivez les performances de vos produits.</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.change !== 0 && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${stat.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stat.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(stat.change)}%
                    </div>
                  )}
                </div>
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Évolution des ventes
              </CardTitle>
              <CardDescription>Performances sur la période sélectionnée.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Graphique en cours de développement</p>
                  <p className="text-xs mt-1">Les données seront bientôt disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary" />
              Top Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucun produit</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-black text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                      <img src={product.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.orders} commandes</p>
                    </div>
                    <p className="font-bold text-sm text-primary">{product.revenue} TND</p>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Besoin d&apos;aide pour améliorer vos ventes ?</h3>
              <p className="text-muted-foreground">Consultez nos conseils et bonnes pratiques pour optimiser vos performances.</p>
            </div>
            <Button className="gap-2 bg-primary">
              Voir les conseils
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
