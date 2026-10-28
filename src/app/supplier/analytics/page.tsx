"use client";

import { useTranslation } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`supplier_app.analytics.${key}`);
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
  const [daily, setDaily] = useState<{ day: string; revenue: number; orders: number }[]>([]);

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

      const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "year" ? 0 : 30;
      const now = new Date();
      const start = days ? new Date(now.getTime() - days * 86400000) : new Date(now.getFullYear(), 0, 1);
      const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()));

      const { data: supplierOrders } = await supabase
        .from("supplier_orders")
        .select("id, status, created_at, items:supplier_order_items(product_id, product_name, product_image, unit_price, quantity)")
        .eq("supplier_id", user.id)
        .neq("status", "awaiting_confirmation")
        .gte("created_at", previousStart.toISOString());

      const all = (supplierOrders || []).filter((o) => o.status !== "cancelled" && o.status !== "rejected");
      const current = all.filter((o) => new Date(o.created_at) >= start);
      const previous = all.filter((o) => new Date(o.created_at) < start);
      const revenueOf = (list: typeof all) =>
        list.flatMap((o) => o.items || []).reduce((sum, i) => sum + Number(i.unit_price || 0) * Number(i.quantity || 0), 0);
      const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : 0);

      const totalRevenue = revenueOf(current);
      setStats({
        totalOrders: current.length,
        totalRevenue,
        totalProducts: productsCount || 0,
        conversionRate: current.filter((o) => o.status === "delivered").length,
        ordersChange: change(current.length, previous.length),
        revenueChange: change(totalRevenue, revenueOf(previous)),
      });

      const byProduct = new Map<string, TopProduct>();
      for (const order of current) {
        for (const item of order.items || []) {
          const key = item.product_id || item.product_name;
          const entry = byProduct.get(key) || {
            id: key,
            name: item.product_name,
            orders: 0,
            revenue: 0,
            image: item.product_image || "/placeholder-product.jpg",
          };
          entry.orders += Number(item.quantity || 0);
          entry.revenue += Number(item.unit_price || 0) * Number(item.quantity || 0);
          byProduct.set(key, entry);
        }
      }
      setTopProducts([...byProduct.values()].sort((x, y) => y.revenue - x.revenue).slice(0, 5));

      const byDay = new Map<string, { day: string; revenue: number; orders: number }>();
      for (let d = new Date(start); d <= now; d = new Date(d.getTime() + 86400000)) {
        const key = d.toISOString().slice(0, 10);
        byDay.set(key, { day: key.slice(5).split("-").reverse().join("/"), revenue: 0, orders: 0 });
      }
      for (const order of current) {
        const entry = byDay.get(order.created_at.slice(0, 10));
        if (!entry) continue;
        entry.orders += 1;
        entry.revenue += (order.items || []).reduce((sum, i) => sum + Number(i.unit_price || 0) * Number(i.quantity || 0), 0);
      }
      setDaily([...byDay.values()]);

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
      title: tr("card_orders"),
      value: stats.totalOrders.toString(), 
      change: stats.ordersChange, 
      icon: ShoppingCart, 
      color: "bg-blue-500"
    },
    { 
      title: tr("card_revenue"),
      value: formatPrice(stats.totalRevenue),
      change: stats.revenueChange, 
      icon: DollarSign, 
      color: "bg-emerald-500"
    },
    { 
      title: tr("card_products"),
      value: stats.totalProducts.toString(), 
      change: 0, 
      icon: Package, 
      color: "bg-purple-500"
    },
    { 
      title: tr("card_delivered"),
      value: stats.conversionRate.toString(), 
      change: 0, 
      icon: TrendingUp, 
      color: "bg-orange-500"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">{tr("statistiques")}</h1>
          <p className="text-muted-foreground">{tr("suivez_les_performances_de_vos")}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{tr("t_7_derniers_jours")}</SelectItem>
            <SelectItem value="30d">{tr("t_30_derniers_jours")}</SelectItem>
            <SelectItem value="90d">{tr("t_90_derniers_jours")}</SelectItem>
            <SelectItem value="year">{tr("cette_annee")}</SelectItem>
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
                {tr("evolution_des_ventes")}
              </CardTitle>
              <CardDescription>{tr("performances_sur_la_periode_selectionnee")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} minTickGap={16} />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} width={48} />
                    <Tooltip formatter={(value) => [formatPrice(Number(value ?? 0)), "CA"]} />
                    <Bar dataKey="revenue" name="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary" />
              {tr("top_produits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{tr("aucun_produit")}</p>
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
              <p className="text-muted-foreground">{tr("consultez_nos_conseils_et_bonnes")}</p>
            </div>
            <Button asChild className="gap-2 bg-primary">
              <a href="/blog" target="_blank" rel="noreferrer">
                {tr("voir_les_conseils")}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
