"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Ticket, 
  Calendar, 
  Users, 
  Trash2, 
  Edit2, 
  Loader2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Percent,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CouponsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    min_purchase: "0",
    usage_limit: "",
    start_date: "",
    end_date: "",
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/seller/promo-codes");
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon: any = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value.toString(),
        min_purchase: coupon.min_purchase.toString(),
        usage_limit: coupon.usage_limit?.toString() || "",
        start_date: coupon.start_date ? format(new Date(coupon.start_date), "yyyy-MM-dd") : "",
        end_date: coupon.end_date ? format(new Date(coupon.end_date), "yyyy-MM-dd") : "",
        is_active: coupon.is_active
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        type: "percentage",
        value: "",
        min_purchase: "0",
        usage_limit: "",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: "",
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCoupon 
        ? `/api/seller/promo-codes/${editingCoupon.id}`
        : "/api/seller/promo-codes";
      
      const method = editingCoupon ? "PATCH" : "POST";

      const body = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: parseFloat(formData.value),
        min_purchase: parseFloat(formData.min_purchase),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingCoupon ? "Coupon mis à jour" : "Coupon créé avec succès");
        setIsDialogOpen(false);
        fetchCoupons();
      } else {
        const err = await response.json();
        toast.error(err.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce coupon ?")) return;

    try {
      const response = await fetch(`/api/seller/promo-codes/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Coupon supprimé");
        fetchCoupons();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    }
  };

  const toggleStatus = async (coupon: any) => {
    try {
      const response = await fetch(`/api/seller/promo-codes/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active })
      });

      if (response.ok) {
        toast.success(coupon.is_active ? "Coupon désactivé" : "Coupon activé");
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Coupons & Promotions</h1>
          <p className="text-muted-foreground">Gérez vos codes promotionnels pour booster vos ventes.</p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4" />
          Créer un coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <Ticket className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coupons actifs</p>
                <p className="text-2xl font-bold">{coupons.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilisations totales</p>
                <p className="text-2xl font-bold">{coupons.reduce((acc, c) => acc + (c.usage_count || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expirent bientôt</p>
                <p className="text-2xl font-bold">
                  {coupons.filter(c => c.end_date && new Date(c.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un code..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des coupons...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Ticket className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun coupon trouvé</h3>
            <p className="text-muted-foreground mb-6">Commencez par créer votre premier code promotionnel.</p>
            <Button onClick={() => handleOpenDialog()}>Créer un coupon</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className={`${!coupon.is_active ? "opacity-60" : ""} group hover:shadow-md transition-all`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg font-mono px-3 py-1 bg-muted">
                      {coupon.code}
                    </Badge>
                    {!coupon.is_active && (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(coupon)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(coupon)}>
                        {coupon.is_active ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="pt-2">
                  {coupon.type === "percentage" ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Percent className="w-4 h-4" />
                      {coupon.value}% de réduction
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-blue-600 font-bold">
                      <DollarSign className="w-4 h-4" />
                      {coupon.value} TND de réduction
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Min. achat</p>
                    <p className="font-medium">{coupon.min_purchase} TND</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Utilisations</p>
                    <p className="font-medium">
                      {coupon.usage_count} / {coupon.usage_limit || "∞"}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-muted-foreground">Validité</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {coupon.start_date ? format(new Date(coupon.start_date), "d MMM yyyy", { locale: fr }) : "Maintenant"}
                      {" → "}
                      {coupon.end_date ? format(new Date(coupon.end_date), "d MMM yyyy", { locale: fr }) : "Illimité"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Modifier le coupon" : "Nouveau coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="code">Code promo</Label>
                <Input 
                  id="code" 
                  placeholder="EX: ETE2024" 
                  className="font-mono uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de réduction</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (TND)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valeur</Label>
                <Input 
                  id="value" 
                  type="number" 
                  placeholder={formData.type === "percentage" ? "10" : "5.00"}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_purchase">Achat minimum (TND)</Label>
                <Input 
                  id="min_purchase" 
                  type="number"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage_limit">Limite d&apos;utilisations</Label>
                <Input 
                  id="usage_limit" 
                  type="number" 
                  placeholder="Illimité"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début</Label>
                <Input 
                  id="start_date" 
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Date d&apos;expiration</Label>
                <Input 
                  id="end_date" 
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Activer le coupon</Label>
                  <p className="text-xs text-muted-foreground">Le coupon sera immédiatement utilisable.</p>
                </div>
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCoupon ? "Mettre à jour" : "Créer le coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
