"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { whatsappLink } from "@/lib/order-messages";

type SiteRequest = {
  id: string;
  name: string;
  business: string;
  phone: string;
  email: string | null;
  city: string | null;
  activity: string | null;
  links: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const STATUSES: Record<string, { label: string; className: string }> = {
  new: { label: "Nouvelle", className: "bg-blue-100 text-blue-700" },
  contacted: { label: "Contactée", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Boutique en cours", className: "bg-purple-100 text-purple-700" },
  delivered: { label: "Boutique livrée", className: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Sans suite", className: "bg-slate-100 text-slate-600" },
};

const CLOSED = ["delivered", "declined"];

export default function SiteRequestsPage() {
  const [rows, setRows] = useState<SiteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    createClient()
      .from("site_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as SiteRequest[]) || []);
        setLoading(false);
      });
  }, []);

  const update = async (id: string, patch: Partial<SiteRequest>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await createClient().from("site_requests").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Enregistrement impossible");
  };

  const count = (key: string) => (key === "open" ? rows.filter((r) => !CLOSED.includes(r.status)).length : key === "all" ? rows.length : rows.filter((r) => r.status === key).length);
  const shown = rows.filter((r) => (filter === "open" ? !CLOSED.includes(r.status) : filter === "all" || r.status === filter));
  const filters: [string, string][] = [["open", "À traiter"], ["all", "Toutes"], ...Object.entries(STATUSES).map(([k, v]) => [k, v.label] as [string, string])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demandes de site</h1>
        <p className="text-muted-foreground">Entreprises qui demandent leur boutique gratuite depuis /creation-site-ecommerce-tunisie.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${filter === key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"}`}
          >
            {label} ({count(key)})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : shown.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Aucune demande.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {shown.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{r.business}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.name}{r.city ? ` · ${r.city}` : ""}{r.activity ? ` · ${r.activity}` : ""} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) => update(r.id, { status: e.target.value })}
                    className={`rounded-full border-0 px-3 py-1 text-sm font-semibold ${STATUSES[r.status]?.className || ""}`}
                    aria-label="Statut"
                  >
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-medium hover:underline"><Phone className="h-4 w-4" />{r.phone}</a>
                  <a
                    href={whatsappLink(r.phone, `Bonjour ${r.name}, ici l'équipe Dropy. Merci pour votre demande de boutique en ligne pour ${r.business}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                  {r.email && <a href={`mailto:${r.email}`} className="font-medium hover:underline">{r.email}</a>}
                </div>
                {r.links && <p className="break-all text-sm"><span className="text-muted-foreground">Liens : </span>{r.links}</p>}
                {r.message && <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm">{r.message}</p>}
                <Textarea
                  defaultValue={r.notes || ""}
                  placeholder="Notes internes (appel, produits reçus, adresse de la boutique…)"
                  rows={2}
                  onBlur={(e) => e.target.value !== (r.notes || "") && update(r.id, { notes: e.target.value })}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
