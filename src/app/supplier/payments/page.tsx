"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Clock, CheckCircle2, Building2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice } from "@/lib/utils";

interface EarningRow {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  amount: number;
}

const IN_PROGRESS = ["pending", "accepted", "preparing", "ready", "ready_for_pickup", "scheduled", "picked_up", "shipped", "in_transit"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Nouvelle",
  accepted: "Acceptée",
  preparing: "En préparation",
  ready: "Prête",
  ready_for_pickup: "Prête à enlever",
  scheduled: "Enlèvement planifié",
  picked_up: "Enlevée",
  shipped: "Expédiée",
  in_transit: "En transit",
  delivered: "Livrée",
  cancelled: "Annulée",
  rejected: "Refusée",
  returned: "Retournée",
};

export default function SupplierPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EarningRow[]>([]);
  const [hasPayoutDetails, setHasPayoutDetails] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: orders }, { data: profile }] = await Promise.all([
        supabase
          .from("supplier_orders")
          .select("id, supplier_order_number, status, created_at, items:supplier_order_items(unit_price, quantity)")
          .eq("supplier_id", user.id)
        .neq("status", "awaiting_confirmation")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("bank_rib, d17_number, flouci_number").eq("id", user.id).maybeSingle(),
      ]);

      setRows(
        (orders || []).map((o: any) => ({
          id: o.id,
          number: o.supplier_order_number,
          status: o.status,
          createdAt: o.created_at,
          amount: (o.items || []).reduce(
            (sum: number, i: any) => sum + Number(i.unit_price || 0) * Number(i.quantity || 0),
            0
          ),
        }))
      );
      setHasPayoutDetails(Boolean(profile?.bank_rib || profile?.d17_number || profile?.flouci_number));
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const earned = rows.filter((r) => r.status === "delivered").reduce((sum, r) => sum + r.amount, 0);
  const inProgress = rows.filter((r) => IN_PROGRESS.includes(r.status)).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Paiements</h1>
        <p className="text-muted-foreground">Vos revenus sur les commandes passées par les boutiques Dropy.</p>
      </div>

      {!hasPayoutDetails && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Coordonnées de versement manquantes</p>
                <p className="text-sm text-amber-800">Ajoutez votre RIB, D17 ou Flouci pour recevoir vos virements.</p>
              </div>
            </div>
            <Button asChild variant="outline" className="bg-white">
              <Link href="/supplier/settings">
                <Building2 className="w-4 h-4 mr-2" />
                Renseigner mes coordonnées
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gagné (commandes livrées)</p>
              <h3 className="text-2xl font-black">{formatPrice(earned)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En cours (pas encore livrées)</p>
              <h3 className="text-2xl font-black">{formatPrice(inProgress)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Détail par commande
          </CardTitle>
          <CardDescription>
            Montant = prix fournisseur × quantité. Dropy vous verse le montant des commandes livrées par virement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucune commande pour le moment.</p>
          ) : (
            <div className="divide-y">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{row.number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary">{STATUS_LABELS[row.status] || row.status}</Badge>
                    <span className="font-black text-sm w-24 text-right">{formatPrice(row.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
