"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  EyeOff,
  Eye,
  Loader2,
  Package,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  status: string;
  rejection_reason?: string;
  images?: any;
  compare_price?: number | null;
  is_active?: boolean;
}

export default function SupplierProductsPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`supplier_app.products.${key}`);
  const statusLabel = (status: string) => {
    const label = tt(`supplier_app.status.${status}`);
    return label.startsWith("supplier_app.") ? status : label;
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", base_price: "", compare_price: "", stock_quantity: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      base_price: String(product.base_price ?? ""),
      compare_price: product.compare_price != null ? String(product.compare_price) : "",
      stock_quantity: String(product.stock_quantity ?? 0),
    });
  };

  const patchProduct = async (id: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/supplier/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const messages: Record<string, string> = {
        invalid_name: tr("invalid_name"),
        invalid_price: tr("invalid_price"),
        invalid_stock: tr("invalid_stock"),
      };
      toast.error(messages[data.error] || tr("save_error"));
      return false;
    }
    return true;
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const ok = await patchProduct(editing.id, {
      name: form.name,
      description: form.description,
      base_price: form.base_price,
      compare_price: form.compare_price,
      stock_quantity: Number(form.stock_quantity),
    });
    setSaving(false);
    if (!ok) return;
    toast.success(tr("produit_mis_a_jour"));
    setEditing(null);
    loadProducts();
  };

  const toggleActive = async (product: Product) => {
    const next = product.is_active === false;
    if (!next && !window.confirm(tr("retire_confirm"))) return;
    if (await patchProduct(product.id, { is_active: next })) {
      toast.success(tr(next ? "restored" : "retired"));
      loadProducts();
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tr("mes_produits")}</h1>
          <p className="text-muted-foreground">{tr("gerez_votre_catalogue_de_produits")}</p>
        </div>
        <Link href="/supplier/products/new">
          <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-600">
            <Plus className="w-4 h-4" />
            {tr("nouveau_produit")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={tr("rechercher_un_produit")} 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-sm font-medium text-muted-foreground">
                  <th className="pb-4 pr-4">{tr("produit")}</th>
                  <th className="pb-4 px-4">{tr("categorie")}</th>
                  <th className="pb-4 px-4">{tr("prix_de_base")}</th>
                  <th className="pb-4 px-4">{tr("stock")}</th>
                  <th className="pb-4 px-4">{tr("statut")}</th>
                  <th className="pb-4 pl-4 text-right">{tr("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="py-4">
                        <div className="h-12 bg-muted animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-lg font-semibold">{tr("aucun_produit_trouve")}</p>
                      <p className="text-muted-foreground">{tr("commencez_par_ajouter_votre_premier")}</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <img 
                                src={product.images?.[0] || product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop"} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          <div>
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary">
                          {product.category || "Général"}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-sm">
                        {formatPrice(product.base_price)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${product.stock_quantity < 10 ? "text-red-500" : ""}`}>
                            {product.stock_quantity}
                          </span>
                          {product.stock_quantity < 10 && <AlertCircle className="w-3 h-3 text-red-500" />}
                        </div>
                      </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full w-fit ${
                              product.status === "approved" ? "bg-green-100 text-green-700" : 
                              product.status === "pending" ? "bg-orange-100 text-orange-700" : 
                              "bg-red-100 text-red-700"
                            }`}>
                              {statusLabel(product.status)}
                            </span>
                            {product.is_active === false && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full w-fit bg-gray-100 text-gray-600">{tr("retire")}</span>
                            )}
                            {product.status === "rejected" && product.rejection_reason && (
                              <div className="group relative">
                                <AlertCircle className="w-4 h-4 text-red-500 cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border z-10">
                                  Raison : {product.rejection_reason}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      <td className="py-4 pl-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => openEdit(product)}>
                              <Edit className="w-4 h-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className={`gap-2 ${product.is_active === false ? "" : "text-red-600"}`} onClick={() => toggleActive(product)}>
                              {product.is_active === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {tr(product.is_active === false ? "restore" : "retire")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tr("modifier_le_produit")}</DialogTitle>
            <DialogDescription>Les changements de prix s&apos;appliquent aux prochaines commandes. Le stock est mis à jour dans les boutiques qui vendent ce produit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{tr("nom")}</Label>
              <Input id="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-price">{tr("prix_dt")}</Label>
                <Input id="edit-price" inputMode="decimal" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-advised">{tr("prix_conseille")}</Label>
                <Input id="edit-advised" inputMode="decimal" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock">{tr("stock")}</Label>
                <Input id="edit-stock" inputMode="numeric" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{tr("description")}</Label>
              <Textarea id="edit-description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{tr("annuler")}</Button>
            <Button onClick={saveEdit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
