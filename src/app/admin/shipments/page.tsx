"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, PackageCheck, PackageX, RotateCcw, MapPin, Phone, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Shipment {
  id: string;
  shipment_number: string;
  external_tracking_id: string | null;
  delivery_status: string;
  pickup_address: { street?: string; city?: string } | null;
  delivery_address: { street?: string; city?: string; governorate?: string } | null;
  cod_amount: number | null;
  shipping_cost: number | null;
  failure_reason: string | null;
  delivery_attempts: number | null;
  created_at: string;
  supplier_order: {
    supplier_order_number: string;
    status: string;
    delivery_address: { name?: string; phone?: string; store_order_number?: string } | null;
  } | null;
  supplier: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "À enlever",
  pickup_scheduled: "À enlever",
  picked_up: "Enlevé",
  in_transit: "En transit",
  out_for_delivery: "En livraison",
  delivered: "Livré",
  failed: "Échec",
  returned: "Retourné",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  pickup_scheduled: "bg-amber-100 text-amber-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_transit: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  returned: "bg-gray-200 text-gray-700",
};

const FILTERS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: "pickup", label: "À enlever", statuses: ["pending", "pickup_scheduled"] },
  { key: "transit", label: "En cours", statuses: ["picked_up", "in_transit", "out_for_delivery"] },
  { key: "done", label: "Livrées", statuses: ["delivered"] },
  { key: "issues", label: "Problèmes", statuses: ["failed", "returned"] },
  { key: "all", label: "Toutes", statuses: null },
];

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pickup");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/shipments");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setShipments(data.shipments || []);
    else toast.error(data.error || "Erreur lors du chargement des livraisons");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, f.statuses ? shipments.filter((s) => f.statuses!.includes(s.delivery_status)).length : shipments.length])
      ),
    [shipments]
  );

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    return f?.statuses ? shipments.filter((s) => f.statuses!.includes(s.delivery_status)) : shipments;
  }, [shipments, filter]);

  const updateStatus = async (shipment: Shipment, status: string) => {
    let failure_reason: string | undefined;
    if (status === "failed") {
      const reason = window.prompt("Motif de l'échec de livraison :");
      if (reason === null) return;
      failure_reason = reason;
    }
    setBusy(shipment.id);
    const res = await fetch(`/api/admin/shipments/${shipment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, failure_reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(`${shipment.shipment_number} : ${STATUS_LABELS[status]}`);
      await load();
    } else {
      toast.error(data.error || "Erreur lors de la mise à jour");
    }
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livraisons</h1>
          <p className="text-gray-500">Suivi des colis fournisseurs : enlèvement, livraison et encaissement COD.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.key ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
            }`}
          >
            {f.label} <span className="ml-1 opacity-70">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <Truck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            Aucune livraison dans cette catégorie.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((s) => {
            const customer = s.supplier_order?.delivery_address;
            const pickupPending = ["pending", "pickup_scheduled"].includes(s.delivery_status);
            const inTransit = ["picked_up", "in_transit", "out_for_delivery"].includes(s.delivery_status);
            return (
              <Card key={s.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{s.shipment_number}</CardTitle>
                      <CardDescription>
                        {s.supplier_order?.supplier_order_number}
                        {customer?.store_order_number ? ` · ${customer.store_order_number}` : ""} · {formatDate(s.created_at)}
                      </CardDescription>
                    </div>
                    <Badge className={`${STATUS_STYLES[s.delivery_status] || "bg-gray-100 text-gray-700"} border-0`}>
                      {STATUS_LABELS[s.delivery_status] || s.delivery_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-400">Enlèvement</p>
                      <p className="font-medium text-gray-900">{s.supplier?.full_name || s.supplier?.email || "Fournisseur"}</p>
                      {s.supplier?.phone && (
                        <p className="flex items-center gap-1 text-gray-600"><Phone className="w-3 h-3" />{s.supplier.phone}</p>
                      )}
                      <p className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {[s.pickup_address?.street, s.pickup_address?.city].filter(Boolean).join(", ") || "Adresse non configurée"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-400">Livraison</p>
                      <p className="font-medium text-gray-900">{customer?.name || "Client"}</p>
                      {customer?.phone && (
                        <p className="flex items-center gap-1 text-gray-600"><Phone className="w-3 h-3" />{customer.phone}</p>
                      )}
                      <p className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {[s.delivery_address?.street, s.delivery_address?.city, s.delivery_address?.governorate].filter(Boolean).join(", ") || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span>À encaisser : <strong>{Number(s.cod_amount || 0).toFixed(2)} TND</strong></span>
                    <span className="text-gray-500">Frais : {Number(s.shipping_cost || 0).toFixed(2)} TND</span>
                    {s.external_tracking_id && <span className="text-gray-500">Suivi : {s.external_tracking_id}</span>}
                  </div>

                  {s.failure_reason && (
                    <p className="text-sm text-red-600">Motif : {s.failure_reason} ({s.delivery_attempts || 1} tentative(s))</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {pickupPending && (
                      <Button size="sm" disabled={busy === s.id} onClick={() => updateStatus(s, "picked_up")} className="bg-purple-600 hover:bg-purple-700">
                        <Truck className="w-4 h-4 mr-1" /> Colis enlevé
                      </Button>
                    )}
                    {(inTransit || s.delivery_status === "failed") && (
                      <Button size="sm" disabled={busy === s.id} onClick={() => updateStatus(s, "delivered")} className="bg-emerald-600 hover:bg-emerald-700">
                        <PackageCheck className="w-4 h-4 mr-1" /> Livré et encaissé
                      </Button>
                    )}
                    {inTransit && (
                      <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => updateStatus(s, "failed")}>
                        <PackageX className="w-4 h-4 mr-1" /> Échec
                      </Button>
                    )}
                    {s.delivery_status === "failed" && (
                      <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => updateStatus(s, "returned")}>
                        <RotateCcw className="w-4 h-4 mr-1" /> Retourné
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
