"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2, XCircle, SendHorizontal, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virement",
  d17: "D17",
  flouci: "Flouci",
};

const STATE_LABELS: Record<string, { label: string; className: string }> = {
  verifying: { label: "À vérifier", className: "bg-amber-100 text-amber-700" },
  escrow: { label: "Sous séquestre", className: "bg-blue-100 text-blue-700" },
  released: { label: "À verser", className: "bg-purple-100 text-purple-700" },
  paid_out: { label: "Versé", className: "bg-emerald-100 text-emerald-700" },
  refunded: { label: "Remboursé", className: "bg-gray-200 text-gray-700" },
};

const TABS = [
  { key: "verifying", label: "Paiements à vérifier" },
  { key: "released", label: "Versements à effectuer" },
  { key: "escrow", label: "Sous séquestre" },
  { key: "all", label: "Historique" },
];

export function ContentPaymentsPanel() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("verifying");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/content/payments");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPayments(data.payments || []);
    else toast.error(data.error || "Impossible de charger les paiements");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => (tab === "all" ? payments : payments.filter((p) => p.state === tab)), [payments, tab]);
  const count = (key: string) => (key === "all" ? payments.length : payments.filter((p) => p.state === key).length);

  const act = async (payment: any, action: "confirm" | "reject" | "payout") => {
    let reference: string | undefined;
    if (action === "payout") {
      const value = window.prompt(`Référence du versement de ${Number(payment.creator_amount).toFixed(2)} TND au créateur :`);
      if (!value) return;
      reference = value;
    }
    if (action === "reject" && !window.confirm("Confirmer que ce paiement n'a pas été reçu ?")) return;
    setBusy(payment.id);
    const res = await fetch(`/api/admin/content/payments/${payment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reference }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(action === "confirm" ? "Paiement confirmé, mission démarrée" : action === "reject" ? "Paiement rejeté" : "Versement enregistré");
      await load();
    } else {
      toast.error(data.error || "Erreur");
    }
    setBusy(null);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-600" />
          Paiements UGC
        </CardTitle>
        <CardDescription>Confirmez les paiements reçus des vendeurs, puis versez les créateurs après validation du contenu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.key ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
              }`}
            >
              {t.label} <span className="ml-1 opacity-70">{count(t.key)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">Rien à traiter ici.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((p) => {
              const state = STATE_LABELS[p.state] || { label: p.state, className: "bg-gray-100 text-gray-700" };
              const creator = p.creator || {};
              return (
                <div key={p.id} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{p.brief?.title || "Mission"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.store?.name || "Boutique"} → {creator.full_name || creator.email || "Créateur"} · {formatDate(p.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.brief?.is_disputed && <Badge variant="destructive">Litige</Badge>}
                      <Badge className={`${state.className} border-0`}>{state.label}</Badge>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Payé par le vendeur</p>
                      <p className="font-semibold">{Number(p.amount).toFixed(2)} TND</p>
                      <p className="text-xs text-muted-foreground">
                        {METHOD_LABELS[p.payment_method] || p.payment_method || "—"} · réf. {p.transaction_ref || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Commission Dropy</p>
                      <p className="font-semibold">{Number(p.platform_commission || 0).toFixed(2)} TND</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dû au créateur</p>
                      <p className="font-semibold">{Number(p.creator_amount || 0).toFixed(2)} TND</p>
                      {p.state === "paid_out" && <p className="text-xs text-muted-foreground">réf. {p.stripe_transfer_id}</p>}
                    </div>
                  </div>

                  {p.state === "released" && (
                    <div className="rounded-lg bg-purple-50 p-3 text-xs space-y-1">
                      <p className="font-semibold text-purple-700">Coordonnées du créateur</p>
                      <p>RIB : {creator.bank_rib ? `${creator.bank_rib}${creator.bank_name ? ` (${creator.bank_name})` : ""}` : "non renseigné"}</p>
                      <p>D17 : {creator.d17_number || "non renseigné"} · Flouci : {creator.flouci_number || "non renseigné"}</p>
                      <p>Téléphone : {creator.phone || "—"} · Email : {creator.email || "—"}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {p.state === "verifying" && (
                      <>
                        <Button size="sm" disabled={busy === p.id} onClick={() => act(p, "confirm")} className="bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Paiement reçu
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => act(p, "reject")}>
                          <XCircle className="w-4 h-4 mr-1" /> Non reçu
                        </Button>
                      </>
                    )}
                    {p.state === "released" && (
                      <Button size="sm" disabled={busy === p.id} onClick={() => act(p, "payout")} className="bg-purple-600 hover:bg-purple-700">
                        <SendHorizontal className="w-4 h-4 mr-1" /> Marquer comme versé
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
