"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  ExternalLink,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock
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

interface SubscriptionStats {
  id: string;
  email: string;
  full_name: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_period_end: string;
  stripe_subscription_id: string;
}

export default function SubscriptionMonitoring() {
  const [subs, setSubs] = useState<SubscriptionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSubscriptions = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, subscription_plan, subscription_status, subscription_period_end, stripe_subscription_id")
      .not("subscription_plan", "is", null)
      .neq("subscription_plan", "starter");

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order("subscription_period_end", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des abonnements");
    } else {
      setSubs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [searchTerm]);

  const totalMRR = subs.reduce((acc, sub) => {
    if (sub.subscription_plan === 'pro') return acc + 49;
    if (sub.subscription_plan === 'enterprise') return acc + 149;
    return acc;
  }, 0);

  const activeCount = subs.filter(s => s.subscription_status === 'active').length;
  const trialingCount = subs.filter(s => s.subscription_status === 'trialing').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abonnements & Revenus</h1>
          <p className="text-muted-foreground">Suivi financier et monitoring Stripe en temps réel.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchSubscriptions()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://dashboard.stripe.com" } }, "*")}>
            Stripe Dashboard
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR (Mensuel)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMRR} TND</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +14.5% vs mois dernier
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abonnés Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trialingCount} en période d&apos;essai
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.4%</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              Stable
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Liste des Abonnements</CardTitle>
              <CardDescription>Détails des facturations en cours</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un client..." 
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
                  <TableHead>Client</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Prochaine facture</TableHead>
                  <TableHead>ID Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/50"></TableCell>
                    </TableRow>
                  ))
                ) : subs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun abonnement payant trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  subs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{sub.full_name}</span>
                          <span className="text-xs text-muted-foreground">{sub.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          sub.subscription_plan === 'enterprise' ? "border-purple-500 text-purple-500" :
                          sub.subscription_plan === 'pro' ? "border-blue-500 text-blue-500" : ""
                        }>
                          {sub.subscription_plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {sub.subscription_status === 'active' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : sub.subscription_status === 'trialing' ? (
                            <Clock className="w-4 h-4 text-blue-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm capitalize">{sub.subscription_status}</span>
                        </div>
                      </TableCell>
<TableCell className="text-sm">
  {sub.subscription_period_end ? formatDate(sub.subscription_period_end) : 'N/A'}
</TableCell>

                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {sub.stripe_subscription_id || 'N/A'}
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
