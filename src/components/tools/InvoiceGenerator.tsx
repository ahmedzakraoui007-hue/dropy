"use client";

import { useEffect, useState } from "react";
import { Info, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/context/LanguageContext";
import { cn, formatPrice } from "@/lib/utils";
import { ToolShell, parseAmount } from "@/components/tools/ToolShell";

type Line = { label: string; qty: string; price: string; vat: string };
type Party = { name: string; taxId: string; address: string; phone: string };

const STORAGE_KEY = "dropy_invoice_seller";
const emptyParty: Party = { name: "", taxId: "", address: "", phone: "" };

export default function InvoiceGenerator() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`tools.generateur-facture.${key}`);
  const [kind, setKind] = useState<"devis" | "facture">("devis");
  const [number, setNumber] = useState("001");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [seller, setSeller] = useState<Party>(emptyParty);
  const [client, setClient] = useState<Party>(emptyParty);
  const [lines, setLines] = useState<Line[]>([{ label: "", qty: "1", price: "", vat: "19" }]);
  const [stamp, setStamp] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSeller({ ...emptyParty, ...JSON.parse(saved) });
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seller));
    } catch {
      return;
    }
  }, [seller]);

  const rows = lines.map((l) => {
    const ht = parseAmount(l.qty) * parseAmount(l.price);
    const vat = (ht * parseAmount(l.vat)) / 100;
    return { ...l, ht, vatAmount: vat };
  });
  const totalHt = rows.reduce((s, r) => s + r.ht, 0);
  const vatByRate = new Map<string, number>();
  for (const r of rows) if (r.vatAmount) vatByRate.set(r.vat, (vatByRate.get(r.vat) || 0) + r.vatAmount);
  const totalVat = rows.reduce((s, r) => s + r.vatAmount, 0);
  const stampAmount = parseAmount(stamp);
  const total = totalHt + totalVat + stampAmount;

  const setLine = (i: number, key: keyof Line, value: string) => setLines((prev) => prev.map((l, j) => (j === i ? { ...l, [key]: value } : l)));
  const partyFields = (party: Party, set: (p: Party) => void, prefix: string) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {(["name", "taxId", "address", "phone"] as const).map((k) => (
        <div key={k} className={cn("space-y-1", k === "address" && "sm:col-span-2")}>
          <Label htmlFor={`${prefix}-${k}`} className="text-xs">{tr(`party_${k}`)}</Label>
          <Input id={`${prefix}-${k}`} value={party[k]} onChange={(e) => set({ ...party, [k]: e.target.value })} />
        </div>
      ))}
    </div>
  );

  return (
    <ToolShell slug="generateur-facture">
      <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 print:hidden">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p>{tr("legal_notice")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 print:hidden">
          <div className="space-y-4 rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(["devis", "facture"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)} className={cn("flex-1 rounded-lg py-2 text-sm font-bold", kind === k ? "bg-white shadow-sm" : "text-slate-500")}>
                  {tr(k)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="inv-number" className="text-xs">{tr("number")}</Label>
                <Input id="inv-number" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inv-date" className="text-xs">{tr("date")}</Label>
                <Input id="inv-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-100 p-6 shadow-sm">
            <p className="font-black text-slate-900">{tr("seller")}</p>
            {partyFields(seller, setSeller, "seller")}
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-100 p-6 shadow-sm">
            <p className="font-black text-slate-900">{tr("client")}</p>
            {partyFields(client, setClient, "client")}
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-100 p-6 shadow-sm">
            <p className="font-black text-slate-900">{tr("lines")}</p>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_90px_60px_auto] items-end gap-2">
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">{tr("line_label")}</Label>}
                  <Input value={line.label} onChange={(e) => setLine(i, "label", e.target.value)} aria-label={tr("line_label")} />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">{tr("qty")}</Label>}
                  <Input inputMode="decimal" value={line.qty} onChange={(e) => setLine(i, "qty", e.target.value)} aria-label={tr("qty")} dir="ltr" />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">{tr("unit_price")}</Label>}
                  <Input inputMode="decimal" value={line.price} onChange={(e) => setLine(i, "price", e.target.value)} aria-label={tr("unit_price")} dir="ltr" />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">{tr("vat")}</Label>}
                  <select value={line.vat} onChange={(e) => setLine(i, "vat", e.target.value)} aria-label={tr("vat")} className="flex h-10 w-full rounded-md border border-input bg-background px-1 text-sm">
                    {["19", "13", "7", "0"].map((r) => <option key={r} value={r}>{r} %</option>)}
                  </select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-red-500" disabled={lines.length === 1} onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))} aria-label={tr("remove_line")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="border-dashed" onClick={() => setLines((prev) => [...prev, { label: "", qty: "1", price: "", vat: "19" }])}>
              <Plus className="me-1 h-4 w-4" />
              {tr("add_line")}
            </Button>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="inv-stamp" className="text-xs">{tr("stamp")}</Label>
                <Input id="inv-stamp" inputMode="decimal" placeholder="0" value={stamp} onChange={(e) => setStamp(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="inv-notes" className="text-xs">{tr("notes")}</Label>
                <Textarea id="inv-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr("notes_ph")} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="print-area rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-800 shadow-sm" dir="ltr">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-lg font-black">{seller.name || tr("party_name")}</p>
                {seller.taxId && <p>MF : {seller.taxId}</p>}
                {seller.address && <p className="whitespace-pre-line">{seller.address}</p>}
                {seller.phone && <p>Tél : {seller.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black uppercase tracking-wide text-[#2E3192]">{kind === "devis" ? "Devis" : "Facture"}</p>
                <p>N° {number}</p>
                <p>{date ? new Date(`${date}T12:00:00`).toLocaleDateString("fr-TN") : ""}</p>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Client</p>
              <p className="font-bold">{client.name || "—"}</p>
              {client.taxId && <p>MF : {client.taxId}</p>}
              {client.address && <p className="whitespace-pre-line">{client.address}</p>}
              {client.phone && <p>Tél : {client.phone}</p>}
            </div>
            <table className="mt-6 w-full text-left">
              <thead>
                <tr className="border-b text-xs uppercase text-slate-400">
                  <th className="py-2">Désignation</th>
                  <th className="py-2 text-right">Qté</th>
                  <th className="py-2 text-right">PU HT</th>
                  <th className="py-2 text-right">TVA</th>
                  <th className="py-2 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2">{r.label || "—"}</td>
                    <td className="py-2 text-right">{r.qty}</td>
                    <td className="py-2 text-right whitespace-nowrap">{formatPrice(parseAmount(r.price))}</td>
                    <td className="py-2 text-right">{r.vat} %</td>
                    <td className="py-2 text-right whitespace-nowrap">{formatPrice(r.ht)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto mt-4 w-64 space-y-1">
              <div className="flex justify-between"><span>Total HT</span><span>{formatPrice(totalHt)}</span></div>
              {[...vatByRate.entries()].map(([rate, amount]) => (
                <div key={rate} className="flex justify-between"><span>TVA {rate} %</span><span>{formatPrice(amount)}</span></div>
              ))}
              {stampAmount > 0 && <div className="flex justify-between"><span>Timbre fiscal</span><span>{formatPrice(stampAmount)}</span></div>}
              <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total TTC</span><span>{formatPrice(total)}</span></div>
            </div>
            {notes && <p className="mt-6 whitespace-pre-line text-xs text-slate-500">{notes}</p>}
          </div>
          <Button onClick={() => window.print()} className="w-full rounded-xl print:hidden">
            <Printer className="me-2 h-4 w-4" />
            {tr("print")}
          </Button>
        </div>
      </div>
    </ToolShell>
  );
}
