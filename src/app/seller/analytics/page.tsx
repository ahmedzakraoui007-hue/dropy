"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Loader2,
  Package,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { toast } from "sonner";

interface AnalyticsData {
  summary: {
    revenue: number;
    orders: number;
    aov: number;
    conversion: number;
    visits: number;
  };
  chartData: any[];
  topProducts: any[];
  topRegions: any[];
}

export default function AnalyticsPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seller/analytics?range=${range}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Analytics Error:", error);
      toast.error("Erreur lors du chargement des analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const exportToCSV = () => {
    if (!data) return;
    
    const headers = ["Date", "Revenu", "Commandes", "Visites"];
    const rows = data.chartData.map(item => [
      item.date,
      item.revenue,
      item.orders,
      item.visits
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_dropy_${range}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV réussi");
  };

  const stats = [
    { 
      title: "Chiffre d'affaires", 
      value: `${data?.summary.revenue.toLocaleString()} TND`, 
      icon: TrendingUp,
      color: "text-violet-500",
      bg: "bg-violet-500/10"
    },
    { 
      title: "Commandes", 
      value: data?.summary.orders.toString() || "0", 
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    { 
      title: "Visiteurs", 
      value: data?.summary.visits.toString() || "0", 
      icon: Users,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10"
    },
    { 
      title: "Taux de conversion", 
      value: `${data?.summary.conversion.toFixed(2)}%`, 
      icon: BarChart3,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Analyse de vos données en cours...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Avancés</h1>
          <p className="text-muted-foreground">Pilotez votre croissance avec des données précises.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px] bg-card">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Aujourd'hui</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="12m">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportToCSV} disabled={!data}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden border-none shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Évolution du Revenu</CardTitle>
              <p className="text-sm text-muted-foreground">Revenu total par jour sur la période sélectionnée.</p>
            </div>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent className="h-[400px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `${value} TND`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-500" />
              Top Produits
            </CardTitle>
            <p className="text-sm text-muted-foreground">Vos meilleures ventes en valeur.</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {data?.topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                <Package className="w-12 h-12 mb-2" />
                <p className="italic text-sm">Aucune donnée disponible</p>
              </div>
            ) : (
              data?.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm truncate max-w-[150px]">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.quantity} ventes</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm">{product.revenue.toLocaleString()} TND</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" />
              Performance par Région
            </CardTitle>
            <p className="text-sm text-muted-foreground">Distribution géographique de vos ventes.</p>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topRegions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px"
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {data?.topRegions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              Statistiques des Commandes
            </CardTitle>
            <p className="text-sm text-muted-foreground">Volume de commandes par jour.</p>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip />
                <Area 
                  type="step" 
                  dataKey="orders" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.1)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
