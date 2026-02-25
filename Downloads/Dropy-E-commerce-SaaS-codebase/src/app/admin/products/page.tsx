"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Check, 
  X, 
  Eye, 
  Package, 
  Search, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatPrice, formatDate } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  base_price: number;
  status: string;
  images: any;
  created_at: string;
  supplier_id: string;
  rejection_reason?: string;
  supplier?: {
    full_name: string;
  };
}

export default function ProductModerationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          supplier:profiles!products_supplier_id_fkey(full_name)
        `)
        .eq("status", activeTab)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(productId: string) {
    try {
      const { error } = await supabase
        .from("products")
        .update({ 
          status: "approved",
          is_active: true 
        })
        .eq("id", productId);

      if (error) throw error;
      
      toast.success("Produit approuvé avec succès");
      setProducts(products.filter(p => p.id !== productId));
      
      // Notify supplier (optional but recommended)
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: products.find(p => p.id === productId)?.supplier_id,
          title: "Produit approuvé",
          message: `Votre produit "${products.find(p => p.id === productId)?.name}" a été approuvé et est maintenant visible sur la marketplace.`,
          type: "system",
          link: "/supplier/products"
        })
      });

    } catch (error) {
      console.error("Error approving product:", error);
      toast.error("Erreur lors de l'approbation");
    }
  }

  async function handleReject() {
    if (!selectedProduct || !rejectionReason.trim()) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason,
          is_active: false
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;
      
      toast.success("Produit rejeté");
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedProduct(null);

      // Notify supplier
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedProduct.supplier_id,
          title: "Produit refusé",
          message: `Votre produit "${selectedProduct.name}" a été refusé. Raison : ${rejectionReason}`,
          type: "error",
          link: "/supplier/products"
        })
      });

    } catch (error) {
      console.error("Error rejecting product:", error);
      toast.error("Erreur lors du rejet");
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplier?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Modération Produits</h1>
          <p className="text-muted-foreground">Validez les nouveaux produits avant leur mise en ligne.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              En attente
              {activeTab === 'pending' && products.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  {products.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Approuvés
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Refusés
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">Aucun produit trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden group border-border/50 hover:border-primary/50 transition-all">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    {product.images && product.images[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-12 h-12 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={
                        product.status === 'pending' ? 'bg-orange-500' :
                        product.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                      }>
                        {product.status === 'pending' ? 'En attente' :
                         product.status === 'approved' ? 'Approuvé' : 'Refusé'}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Fournisseur: <span className="text-foreground font-medium">{product.supplier?.full_name || 'Inconnu'}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(product.base_price)}
                      </div>
<div className="text-xs text-muted-foreground">
  {formatDate(product.created_at)}
</div>

                    </div>

                    {activeTab === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30 dark:hover:bg-rose-900/20"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsRejectDialogOpen(true);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                        <Button 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApprove(product.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approuver
                        </Button>
                      </div>
                    )}

                    {activeTab === 'rejected' && product.rejection_reason && (
                      <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Raison du refus :
                        </p>
                        <p className="text-xs text-rose-600 dark:text-rose-400 italic">
                          "{product.rejection_reason}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le produit</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison pour laquelle vous refusez ce produit. Le fournisseur sera notifié.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Input value={selectedProduct?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Raison du refus</Label>
              <Textarea 
                placeholder="Ex: Images de mauvaise qualité, description incomplète, prix non conforme..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Annuler</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
