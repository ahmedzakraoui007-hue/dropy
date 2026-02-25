"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Settings,
  Search,
  Filter,
  Send,
  FileText,
  Copy,
  ExternalLink,
  Phone,
  User,
  Calendar,
  ChevronRight,
  Printer,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  variant_info?: Record<string, string>;
}

interface SupplierOrder {
  id: string;
  supplier_order_number: string;
  order_id: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  ready_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
  shipping_company?: string;
  estimated_delivery?: string;
  delivery_address?: {
    name: string;
    phone: string;
    address: string;
    governorate: string;
    delegation?: string;
  };
  supplier_notes?: string;
  items: OrderItem[];
  store_order?: {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    customer_governorate: string;
    total_amount: number;
  };
}

const deliveryCompanies = [
  { id: "aramex", name: "Aramex", logo: "🚚" },
  { id: "fedex", name: "FedEx Tunisia", logo: "📦" },
  { id: "rapid-poste", name: "Rapid Poste", logo: "✉️" },
  { id: "sotupab", name: "Sotupab", logo: "🚛" },
  { id: "dhl", name: "DHL Express", logo: "🟡" },
  { id: "other", name: "Autre transporteur", logo: "🚐" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-orange-100 text-orange-700 border-orange-200",
  ready: "bg-purple-100 text-purple-700 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  preparing: "En préparation",
  ready: "Prête",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function SupplierShippingPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [showBordereauDialog, setShowBordereauDialog] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    shippingCompany: "",
    trackingNumber: "",
    estimatedDelivery: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("supplier_orders")
        .select(`
          *,
          items:supplier_order_items(*),
          store_order:store_orders(
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            customer_governorate,
            total_amount
          )
        `)
        .eq("supplier_id", user.id)
        .in("status", ["ready", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleShipOrder() {
    if (!selectedOrder || !shipmentData.shippingCompany || !shipmentData.trackingNumber) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const { error: supplierError } = await supabase
        .from("supplier_orders")
        .update({
          status: "shipped",
          shipped_at: new Date().toISOString(),
          shipping_company: shipmentData.shippingCompany,
          tracking_number: shipmentData.trackingNumber,
          estimated_delivery: shipmentData.estimatedDelivery || null,
          delivery_address: selectedOrder.store_order ? {
            name: selectedOrder.store_order.customer_name,
            phone: selectedOrder.store_order.customer_phone,
            address: selectedOrder.store_order.customer_address,
            governorate: selectedOrder.store_order.customer_governorate
          } : null,
          supplier_notes: shipmentData.notes
        })
        .eq("id", selectedOrder.id);

      if (supplierError) throw supplierError;

      if (selectedOrder.order_id) {
        const { error: storeError } = await supabase
          .from("store_orders")
          .update({
            status: "shipped",
            shipped_at: new Date().toISOString(),
            shipping_company: shipmentData.shippingCompany,
            tracking_number: shipmentData.trackingNumber,
            estimated_delivery: shipmentData.estimatedDelivery || null,
            supplier_order_id: selectedOrder.id
          })
          .eq("id", selectedOrder.order_id);

        if (storeError) console.error("Store order update error:", storeError);
      }

      toast.success("Commande expédiée avec succès");
      setShowShipDialog(false);
      setShipmentData({ shippingCompany: "", trackingNumber: "", estimatedDelivery: "", notes: "" });
      loadOrders();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'expédition");
    } finally {
      setSubmitting(false);
    }
  }

  async function markAsDelivered(order: SupplierOrder) {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("supplier_orders")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString()
        })
        .eq("id", order.id);

      if (error) throw error;

      if (order.order_id) {
        await supabase
          .from("store_orders")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString()
          })
          .eq("id", order.order_id);
      }

      toast.success("Commande marquée comme livrée");
      loadOrders();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  function generateTrackingNumber() {
    const prefix = shipmentData.shippingCompany?.toUpperCase().slice(0, 3) || "TRK";
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${random}${timestamp}`;
  }

  function copyTrackingNumber(trackingNumber: string) {
    navigator.clipboard.writeText(trackingNumber);
    toast.success("Numéro de suivi copié");
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.supplier_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.store_order?.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const readyOrders = orders.filter(o => o.status === "ready");
  const shippedOrders = orders.filter(o => o.status === "shipped");
  const deliveredOrders = orders.filter(o => o.status === "delivered");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Expéditions</h1>
          <p className="text-muted-foreground">Gérez vos expéditions et suivez les livraisons.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-purple-600">{readyOrders.length}</p>
                <p className="text-sm text-purple-600/70 font-medium">Prêtes à expédier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-indigo-600">{shippedOrders.length}</p>
                <p className="text-sm text-indigo-600/70 font-medium">En transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-green-600">{deliveredOrders.length}</p>
                <p className="text-sm text-green-600/70 font-medium">Livrées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-amber-600">
                  {shippedOrders.filter(o => {
                    if (!o.estimated_delivery) return false;
                    return new Date(o.estimated_delivery) < new Date();
                  }).length}
                </p>
                <p className="text-sm text-amber-600/70 font-medium">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Gestion des expéditions
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ready">Prêtes</SelectItem>
                  <SelectItem value="shipped">Expédiées</SelectItem>
                  <SelectItem value="delivered">Livrées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Aucune expédition</h3>
              <p className="text-muted-foreground text-sm">
                Les commandes prêtes à expédier apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold">{order.supplier_order_number}</p>
                          <Badge className={`${statusColors[order.status]} border text-xs`}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        {order.store_order && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {order.store_order.customer_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {order.store_order.customer_governorate}
                            </span>
                            {order.store_order.customer_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.store_order.customer_phone}
                              </span>
                            )}
                          </div>
                        )}
                        {order.tracking_number && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 rounded-lg">
                            <Truck className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-mono text-indigo-700">{order.tracking_number}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyTrackingNumber(order.tracking_number!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Link href={`/track/${order.store_order?.order_number || order.supplier_order_number}`} target="_blank">
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === "ready" && (
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowShipDialog(true);
                          }}
                          className="gap-2 bg-primary"
                        >
                          <Send className="w-4 h-4" />
                          Expédier
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowBordereauDialog(true);
                            }}
                            className="gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Bordereau
                          </Button>
                          <Button
                            onClick={() => markAsDelivered(order)}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Marquer livrée
                          </Button>
                        </>
                      )}
                      {order.status === "delivered" && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowBordereauDialog(true);
                          }}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Bordereau
                        </Button>
                      )}
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-bold text-muted-foreground mb-2">Articles ({order.items.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                            {item.product_image ? (
                              <img src={item.product_image} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium">{item.product_name}</p>
                              <p className="text-[10px] text-muted-foreground">x{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Expédier la commande
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.supplier_order_number} - {selectedOrder?.store_order?.customer_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedOrder?.store_order && (
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm font-bold mb-2">Adresse de livraison</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">{selectedOrder.store_order.customer_name}</p>
                  <p>{selectedOrder.store_order.customer_address}</p>
                  <p>{selectedOrder.store_order.customer_governorate}</p>
                  {selectedOrder.store_order.customer_phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedOrder.store_order.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-bold">Transporteur *</Label>
              <Select
                value={shipmentData.shippingCompany}
                onValueChange={(v) => setShipmentData(prev => ({ ...prev, shippingCompany: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un transporteur" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryCompanies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      <span className="flex items-center gap-2">
                        <span>{company.logo}</span>
                        {company.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Numéro de suivi *</Label>
              <div className="flex gap-2">
                <Input
                  value={shipmentData.trackingNumber}
                  onChange={(e) => setShipmentData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  placeholder="Ex: TRK-XXXXX"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShipmentData(prev => ({ ...prev, trackingNumber: generateTrackingNumber() }))}
                >
                  Générer
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Date de livraison estimée</Label>
              <Input
                type="date"
                value={shipmentData.estimatedDelivery}
                onChange={(e) => setShipmentData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Notes (optionnel)</Label>
              <Textarea
                value={shipmentData.notes}
                onChange={(e) => setShipmentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Instructions spéciales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleShipOrder} disabled={submitting} className="gap-2">
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Confirmer l'expédition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBordereauDialog} onOpenChange={setShowBordereauDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bordereau de livraison</DialogTitle>
          </DialogHeader>
          {selectedOrder && <BordereauProfessionnel order={selectedOrder} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BordereauProfessionnel({ order }: { order: SupplierOrder }) {
  const TVA_RATE = 0.19;
  const TIMBRE_FISCAL = 1;

  const subtotalHT = order.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const tvaAmount = subtotalHT * TVA_RATE;
  const totalTTC = subtotalHT + tvaAmount + TIMBRE_FISCAL;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimer
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Télécharger PDF
        </Button>
      </div>

      <div id="bordereau-content" className="bg-white p-8 border rounded-xl print:border-0 print:p-0">
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-800">
          <div>
            <h1 className="text-3xl font-black tracking-tight">BORDEREAU DE LIVRAISON</h1>
            <p className="text-sm text-muted-foreground mt-1">Bon de livraison / Delivery Note</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-primary mb-2">DROPY</div>
            <p className="text-xs text-muted-foreground">Plateforme E-commerce Tunisie</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Expéditeur</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg">DROPY Logistics</p>
              <p className="text-sm text-muted-foreground">Centre de distribution</p>
              <p className="text-sm text-muted-foreground">Zone Industrielle, Tunis</p>
              <p className="text-sm text-muted-foreground">MF: 1234567/A/B/C/000</p>
              <p className="text-sm text-muted-foreground">Tél: +216 71 XXX XXX</p>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Destinataire</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg">{order.store_order?.customer_name || "Client"}</p>
              <p className="text-sm">{order.store_order?.customer_address}</p>
              <p className="text-sm">{order.store_order?.customer_governorate}</p>
              {order.store_order?.customer_phone && (
                <p className="text-sm flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.store_order.customer_phone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">N° Bordereau</p>
            <p className="font-mono font-bold text-lg">{order.supplier_order_number}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">Date d'expédition</p>
            <p className="font-bold text-lg">
              {order.shipped_at ? format(new Date(order.shipped_at), "dd/MM/yyyy", { locale: fr }) : format(new Date(), "dd/MM/yyyy", { locale: fr })}
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl text-center border border-indigo-200">
            <p className="text-xs text-indigo-600 mb-1">N° Suivi</p>
            <p className="font-mono font-bold text-lg text-indigo-700">{order.tracking_number || "—"}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            DÉTAIL DES ARTICLES
          </h3>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Référence</th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Désignation</th>
                  <th className="py-3 px-4 text-center text-xs font-bold uppercase tracking-wider">Qté</th>
                  <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider">P.U HT</th>
                  <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-3 px-4 text-sm font-mono">{item.product_sku || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.product_image && (
                          <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{item.product_name}</p>
                          {item.variant_info && Object.keys(item.variant_info).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(item.variant_info).map(([k, v]) => `${k}: ${v}`).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">{item.unit_price.toFixed(3)} TND</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{(item.unit_price * item.quantity).toFixed(3)} TND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="border rounded-xl overflow-hidden">
              <div className="flex justify-between py-3 px-4 bg-gray-50">
                <span className="text-sm">Total HT</span>
                <span className="font-mono font-bold">{subtotalHT.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between py-3 px-4 border-t">
                <span className="text-sm">TVA (19%)</span>
                <span className="font-mono">{tvaAmount.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between py-3 px-4 border-t">
                <span className="text-sm">Timbre fiscal</span>
                <span className="font-mono">{TIMBRE_FISCAL.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between py-4 px-4 bg-gray-800 text-white">
                <span className="font-bold">TOTAL TTC</span>
                <span className="font-mono font-black text-xl">{totalTTC.toFixed(3)} TND</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="text-xs font-bold text-amber-700 uppercase mb-2">Mode de paiement</h4>
            <p className="font-bold text-amber-800">Paiement à la livraison (COD)</p>
            <p className="text-sm text-amber-600 mt-1">
              Montant à collecter: <span className="font-bold">{totalTTC.toFixed(3)} TND</span>
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Transporteur</h4>
            <p className="font-bold text-blue-800">
              {deliveryCompanies.find(c => c.id === order.shipping_company)?.name || order.shipping_company || "Non spécifié"}
            </p>
            {order.estimated_delivery && (
              <p className="text-sm text-blue-600 mt-1">
                Livraison estimée: {format(new Date(order.estimated_delivery), "dd MMMM yyyy", { locale: fr })}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-dashed">
          <div className="text-center">
            <div className="border-b-2 border-gray-300 pb-16 mb-2"></div>
            <p className="text-xs text-muted-foreground">Signature & cachet expéditeur</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-300 pb-16 mb-2"></div>
            <p className="text-xs text-muted-foreground">Signature du destinataire</p>
            <p className="text-[10px] text-muted-foreground mt-1">Date de réception: ___/___/______</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Document généré automatiquement par la plateforme DROPY</p>
          <p className="mt-1">
            En cas de litige, veuillez contacter: support@dropy.store | +216 XX XXX XXX
          </p>
          <p className="mt-2 text-[10px]">
            Ce document fait foi de la livraison des marchandises décrites ci-dessus.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #bordereau-content, #bordereau-content * {
            visibility: visible;
          }
          #bordereau-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
