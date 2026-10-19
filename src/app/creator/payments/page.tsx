"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  CreditCard,
  History,
  TrendingUp,
  Download,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATE: Record<string, { label: string; className: string }> = {
  verifying: { label: "Paiement vendeur en vérification", className: "bg-amber-100 text-amber-700" },
  escrow: { label: "Sous séquestre", className: "bg-blue-100 text-blue-700" },
  released: { label: "Versement en cours", className: "bg-purple-100 text-purple-700" },
  paid_out: { label: "Versé", className: "bg-emerald-100 text-emerald-700" },
  refunded: { label: "Remboursé au vendeur", className: "bg-gray-200 text-gray-700" },
};

function paymentState(p: any) {
  if (p.status === "refunded") return "refunded";
  if (p.status === "released") return p.stripe_transfer_id ? "paid_out" : "released";
  return p.escrowed_at ? "escrow" : "verifying";
}

export default function CreatorPaymentsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    available: 0,
    escrow: 0,
    total: 0
  });

  useEffect(() => {
    async function fetchPayments() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("content_payments")
        .select(`
          *,
          brief:content_briefs(title)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPayments(data);

        const sum = (state: string) =>
          data.filter((p) => paymentState(p) === state).reduce((acc, p) => acc + Number(p.creator_amount || 0), 0);

        setStats({
          available: sum("released"),
          escrow: sum("escrow"),
          total: sum("paid_out"),
        });
      }
      setIsLoading(false);
    }

    fetchPayments();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Revenus et paiements</h1>
            <p className="text-muted-foreground">Suivez vos missions payées et vos versements</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-violet-500 to-purple-600">
            <Link href="/creator/settings">
              Coordonnées de versement
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium opacity-80">Versement en cours</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.available.toFixed(2)} TND</h3>
                </div>
                <div className="p-2 bg-white/10 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En séquestre</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.escrow.toFixed(2)} TND</h3>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total perçu</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.total.toFixed(2)} TND</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Historique des transactions</CardTitle>
                  <CardDescription>Paiements de vos missions</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-10" />
                    <p>Aucune transaction pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => { const state = STATE[paymentState(payment)]; return (
                      <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            payment.stripe_transfer_id ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                          )}>
                            {payment.stripe_transfer_id ? <ArrowDownLeft className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-semibold">{payment.brief?.title}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(payment.created_at), "dd/MM/yyyy HH:mm")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{Number(payment.creator_amount || 0).toFixed(2)} TND</p>
                          <Badge className={`${state.className} border-0 text-[10px] h-5`}>
                            {state.label}
                          </Badge>
                        </div>
                      </div>
                    ); })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Moyens de versement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-border/50 bg-muted/30 flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg border">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-muted-foreground">Dropy vous verse vos gains par virement (RIB), D17 ou Flouci selon les coordonnées de vos paramètres.</p>
                </div>
                <Button asChild variant="outline" className="w-full text-xs">
                  <Link href="/creator/settings">Gérer mes coordonnées</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-bold">Quand suis-je payé ?</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dès que le vendeur valide votre contenu, Dropy vous verse votre part (montant moins la commission de la plateforme).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
