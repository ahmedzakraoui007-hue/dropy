"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  Filter,
  ChevronRight,
  Send,
  FileText,
  Copy,
  ExternalLink,
  Calendar,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  product_image?: string;
  product_sku?: string;
}

interface OrderForShipping {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_governorate?: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  status: string;
  payment_method: string;
  created_at: string;
  tracking_number?: string;
  shipping_company?: string;
  items: OrderItem[];
  store?: {
    name: string;
    logo_url?: string;
  };
}

const deliveryCompanies = [
  { id: 'dropy_internal', name: 'Dropy Livraison', logo: '🚚' },
  { id: 'aramex', name: 'Aramex', logo: '📦' },
  { id: 'tunisie_livraison', name: 'Tunisie Livraison', logo: '🇹🇳' },
  { id: 'rapid-poste', name: 'Rapid Poste', logo: '✉️' },
  { id: 'manual', name: 'Livraison manuelle', logo: '👤' },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  confirmed: "bg-yellow-100 text-yellow-700",
  preparing: "bg-orange-100 text-orange-700",
  ready_to_ship: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready_to_ship: "Prêt à expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
};

export default function SellerShippingPage() {
  const [orders, setOrders] = useState<OrderForShipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ready_to_ship");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showBordereauModal, setShowBordereauModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [processing, setProcessing] = useState(false);
  const [storeInfo, setStoreInfo] = useState<{ name: string; logo_url?: string } | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, logo_url")
      .eq("seller_id", user.id)
      .single();

    if (!store) {
      setLoading(false);
      return;
    }

    setStoreInfo({ name: store.name, logo_url: store.logo_url });

    let query = supabase
      .from("store_orders")
      .select(`
        *,
        items:store_order_items(id, product_name, quantity, unit_price, product_image, product_sku)
      `)
      .eq("store_id", store.id)
      .in("status", statusFilter === "all" 
        ? ["new", "confirmed", "preparing", "ready_to_ship", "shipped"]
        : [statusFilter])
      .order("created_at", { ascending: false });

    const { data } = await query;
    if (data) setOrders(data);
    setLoading(false);
  }

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(search.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleMarkReady = async (orderId: string) => {
    const supabase = createClient();
    await supabase
      .from("store_orders")
      .update({ status: "ready_to_ship" })
      .eq("id", orderId);
    toast.success("Commande marquée prête à expédier");
    loadOrders();
  };

  const handleShipOrders = async () => {
    if (!selectedCompany || selectedOrders.length === 0) return;
    setProcessing(true);

    try {
      const supabase = createClient();
      
      for (const orderId of selectedOrders) {
        const trackingNumber = `${selectedCompany.toUpperCase().slice(0,3)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        
        await supabase
          .from("store_orders")
          .update({
            status: "shipped",
            shipping_company: selectedCompany,
            tracking_number: trackingNumber,
            shipped_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      }

      toast.success(`${selectedOrders.length} commande(s) expédiée(s)`);
      setShowShipModal(false);
      setSelectedOrders([]);
      setSelectedCompany("");
      loadOrders();
    } catch (error) {
      toast.error("Erreur lors de l'expédition");
    } finally {
      setProcessing(false);
    }
  };

  const copyTrackingNumber = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    toast.success("Numéro de suivi copié");
  };

  const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            Gestion des Livraisons
          </h1>
          <p className="text-muted-foreground">Expédiez vos produits à vos clients.</p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setShowBordereauModal(true)}>
                <FileText className="w-4 h-4" />
                Bordereau ({selectedOrders.length})
              </Button>
              <Button className="gap-2 bg-primary" onClick={() => setShowShipModal(true)}>
                <Send className="w-4 h-4" />
                Expédier ({selectedOrders.length})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "À préparer", value: orders.filter(o => o.status === "confirmed").length, color: "bg-yellow-500" },
          { label: "Prêt à expédier", value: orders.filter(o => o.status === "ready_to_ship").length, color: "bg-purple-500" },
          { label: "En transit", value: orders.filter(o => o.status === "shipped").length, color: "bg-blue-500" },
          { label: "Livrées", value: orders.filter(o => o.status === "delivered").length, color: "bg-green-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-10 rounded-full ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="confirmed">À préparer</SelectItem>
                <SelectItem value="ready_to_ship">Prêt à expédier</SelectItem>
                <SelectItem value="shipped">Expédiées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
              <Checkbox
                checked={selectedOrders.length === filteredOrders.length}
                onCheckedChange={selectAllOrders}
              />
              <span className="text-sm text-muted-foreground">
                {selectedOrders.length > 0 
                  ? `${selectedOrders.length} sélectionnée(s)`
                  : "Tout sélectionner"}
              </span>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-semibold">Aucune commande</p>
                <p className="text-muted-foreground">Pas de commandes à traiter pour le moment.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border transition-all ${
                    selectedOrders.includes(order.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-primary">{order.order_number}</span>
                            <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                            {order.payment_method === "cod" && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                COD: {order.total_amount} TND
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(order.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{order.total_amount} TND</p>
                          <p className="text-xs text-muted-foreground">{order.items.length} article(s)</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{order.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{order.customer_phone}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 mt-0.5" />
                            <span>{order.customer_address}{order.customer_governorate && `, ${order.customer_governorate}`}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium mb-2">Articles:</p>
                          <div className="space-y-1">
                            {order.items.slice(0, 3).map(item => (
                              <div key={item.id} className="text-sm flex items-center gap-2">
                                {item.product_image && (
                                  <img src={item.product_image} alt="" className="w-6 h-6 rounded object-cover" />
                                )}
                                <span className="text-muted-foreground">{item.product_name} x{item.quantity}</span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-muted-foreground">+{order.items.length - 3} autres</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {order.tracking_number && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">
                              {deliveryCompanies.find(c => c.id === order.shipping_company)?.name || order.shipping_company}
                            </p>
                            <p className="text-xs text-blue-600 font-mono">{order.tracking_number}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyTrackingNumber(order.tracking_number!)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <a href={`/track/${order.order_number}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1 text-blue-700 border-blue-200">
                              <ExternalLink className="w-4 h-4" />
                              Suivi
                            </Button>
                          </a>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {order.status === "confirmed" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkReady(order.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Marquer prêt
                          </Button>
                        )}
                        {order.status === "ready_to_ship" && (
                          <Button 
                            size="sm" 
                            className="bg-primary"
                            onClick={() => {
                              setSelectedOrders([order.id]);
                              setShowShipModal(true);
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Expédier
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrders([order.id]);
                            setShowBordereauModal(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Bordereau
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showShipModal} onOpenChange={setShowShipModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expédier les commandes</DialogTitle>
            <DialogDescription>
              {selectedOrders.length} commande(s) sélectionnée(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Société de livraison</label>
              <div className="grid grid-cols-2 gap-3">
                {deliveryCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompany(company.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCompany === company.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-2xl mb-2">{company.logo}</div>
                    <p className="font-medium text-sm">{company.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Rappel</p>
                  <p>Un numéro de suivi sera automatiquement généré pour chaque commande.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowShipModal(false)}>
              Annuler
            </Button>
            <Button
              className="bg-primary"
              onClick={handleShipOrders}
              disabled={!selectedCompany || processing}
            >
              {processing ? "Traitement..." : "Confirmer l'expédition"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBordereauModal} onOpenChange={setShowBordereauModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bordereau de Livraison Professionnel</DialogTitle>
          </DialogHeader>
          <BordereauProfessionnel 
            orders={selectedOrdersData} 
            storeName={storeInfo?.name || "Ma Boutique"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BordereauProfessionnel({ orders, storeName }: { orders: OrderForShipping[], storeName: string }) {
  const TVA_RATE = 0.19;
  const TIMBRE_FISCAL = 1;

  const handlePrint = () => {
    window.print();
  };

  const calculateOrderTotals = (order: OrderForShipping) => {
    const subtotalHT = order.items.reduce((sum, item) => sum + ((item.unit_price || 0) * item.quantity), 0);
    const shippingHT = (order.shipping_cost || 7) / (1 + TVA_RATE);
    const totalHT = subtotalHT + shippingHT;
    const tvaAmount = totalHT * TVA_RATE;
    const totalTTC = totalHT + tvaAmount + TIMBRE_FISCAL;
    return { subtotalHT, shippingHT, totalHT, tvaAmount, totalTTC };
  };

  const grandTotalTTC = orders.reduce((sum, order) => {
    const { totalTTC } = calculateOrderTotals(order);
    return sum + totalTTC;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimer
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          PDF
        </Button>
      </div>

      <div id="bordereau-seller" className="bg-white print:p-0">
        {orders.map((order, orderIndex) => {
          const { subtotalHT, shippingHT, totalHT, tvaAmount, totalTTC } = calculateOrderTotals(order);
          
          return (
            <div key={order.id} className={`p-8 border rounded-xl mb-6 print:border-0 print:mb-0 ${orderIndex > 0 ? 'print:break-before-page' : ''}`}>
              <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-800">
                <div>
                  <h1 className="text-2xl font-black tracking-tight">BORDEREAU DE LIVRAISON</h1>
                  <p className="text-sm text-muted-foreground mt-1">Bon de livraison / Delivery Note</p>
                  <div className="mt-3 inline-flex items-center px-3 py-1 bg-primary/10 rounded-full">
                    <span className="text-xs font-bold text-primary">N° {order.order_number}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-primary mb-1">{storeName}</div>
                  <p className="text-xs text-muted-foreground">Propulsé par DROPY</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Expéditeur</h3>
                  <div className="space-y-1">
                    <p className="font-bold text-lg">{storeName}</p>
                    <p className="text-sm text-muted-foreground">Via DROPY E-commerce</p>
                    <p className="text-sm text-muted-foreground">Tunisie</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Destinataire</h3>
                  <div className="space-y-1">
                    <p className="font-bold text-lg">{order.customer_name}</p>
                    <p className="text-sm">{order.customer_address}</p>
                    <p className="text-sm">{order.customer_governorate}</p>
                    {order.customer_phone && (
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Date commande</p>
                  <p className="font-bold">{format(new Date(order.created_at), "dd/MM/yyyy", { locale: fr })}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Transporteur</p>
                  <p className="font-bold">
                    {deliveryCompanies.find(c => c.id === order.shipping_company)?.name || order.shipping_company || "—"}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-center border border-indigo-200">
                  <p className="text-xs text-indigo-600 mb-1">N° Suivi</p>
                  <p className="font-mono font-bold text-indigo-700">{order.tracking_number || "À générer"}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  DÉTAIL DES ARTICLES
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="py-3 px-4 text-left text-xs font-bold uppercase">Réf.</th>
                        <th className="py-3 px-4 text-left text-xs font-bold uppercase">Désignation</th>
                        <th className="py-3 px-4 text-center text-xs font-bold uppercase">Qté</th>
                        <th className="py-3 px-4 text-right text-xs font-bold uppercase">P.U HT</th>
                        <th className="py-3 px-4 text-right text-xs font-bold uppercase">Total HT</th>
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
                              <p className="font-medium text-sm">{item.product_name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono">{(item.unit_price || 0).toFixed(3)} TND</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {((item.unit_price || 0) * item.quantity).toFixed(3)} TND
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end mb-6">
                <div className="w-80">
                  <div className="border rounded-xl overflow-hidden">
                    <div className="flex justify-between py-2 px-4 bg-gray-50">
                      <span className="text-sm">Sous-total HT</span>
                      <span className="font-mono">{subtotalHT.toFixed(3)} TND</span>
                    </div>
                    <div className="flex justify-between py-2 px-4 border-t">
                      <span className="text-sm">Frais de livraison HT</span>
                      <span className="font-mono">{shippingHT.toFixed(3)} TND</span>
                    </div>
                    <div className="flex justify-between py-2 px-4 border-t bg-gray-50">
                      <span className="text-sm font-medium">Total HT</span>
                      <span className="font-mono font-bold">{totalHT.toFixed(3)} TND</span>
                    </div>
                    <div className="flex justify-between py-2 px-4 border-t">
                      <span className="text-sm">TVA (19%)</span>
                      <span className="font-mono">{tvaAmount.toFixed(3)} TND</span>
                    </div>
                    <div className="flex justify-between py-2 px-4 border-t">
                      <span className="text-sm">Timbre fiscal</span>
                      <span className="font-mono">{TIMBRE_FISCAL.toFixed(3)} TND</span>
                    </div>
                    <div className="flex justify-between py-3 px-4 bg-gray-800 text-white">
                      <span className="font-bold">TOTAL TTC</span>
                      <span className="font-mono font-black text-lg">{totalTTC.toFixed(3)} TND</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className={`p-4 rounded-xl border ${order.payment_method === 'cod' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                  <h4 className={`text-xs font-bold uppercase mb-2 ${order.payment_method === 'cod' ? 'text-amber-700' : 'text-green-700'}`}>
                    Mode de paiement
                  </h4>
                  <p className={`font-bold ${order.payment_method === 'cod' ? 'text-amber-800' : 'text-green-800'}`}>
                    {order.payment_method === 'cod' ? 'Paiement à la livraison (COD)' : 'Payé en ligne'}
                  </p>
                  {order.payment_method === 'cod' && (
                    <p className="text-sm text-amber-600 mt-1">
                      Montant à collecter: <span className="font-bold">{totalTTC.toFixed(3)} TND</span>
                    </p>
                  )}
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Instructions</h4>
                  <p className="text-sm text-blue-800">
                    Veuillez vérifier le contenu du colis avant signature.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-dashed">
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 pb-12 mb-2"></div>
                  <p className="text-xs text-muted-foreground">Signature & cachet expéditeur</p>
                </div>
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 pb-12 mb-2"></div>
                  <p className="text-xs text-muted-foreground">Signature du destinataire</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Date de réception: ___/___/______</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
                <p>Document généré automatiquement par DROPY - Plateforme E-commerce Tunisie</p>
                <p className="mt-1 text-[10px]">
                  Ce document fait foi de la livraison des marchandises décrites ci-dessus.
                </p>
              </div>
            </div>
          );
        })}

        {orders.length > 1 && (
          <div className="p-6 bg-gray-100 rounded-xl border-2 border-gray-300 print:break-before-page">
            <h2 className="text-xl font-black mb-4">RÉCAPITULATIF - {orders.length} COMMANDES</h2>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b-2 border-gray-400">
                  <th className="py-2 text-left text-sm font-bold">N° Commande</th>
                  <th className="py-2 text-left text-sm font-bold">Client</th>
                  <th className="py-2 text-left text-sm font-bold">Gouvernorat</th>
                  <th className="py-2 text-right text-sm font-bold">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const { totalTTC } = calculateOrderTotals(order);
                  return (
                    <tr key={order.id} className="border-b">
                      <td className="py-2 font-mono text-sm">{order.order_number}</td>
                      <td className="py-2 text-sm">{order.customer_name}</td>
                      <td className="py-2 text-sm">{order.customer_governorate}</td>
                      <td className="py-2 text-right font-mono font-bold">{totalTTC.toFixed(3)} TND</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800 text-white">
                  <td colSpan={3} className="py-3 px-2 font-bold">TOTAL GÉNÉRAL</td>
                  <td className="py-3 px-2 text-right font-mono font-black text-xl">{grandTotalTTC.toFixed(3)} TND</td>
                </tr>
              </tfoot>
            </table>
            <p className="text-xs text-muted-foreground text-center">
              Généré le {format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #bordereau-seller, #bordereau-seller * {
            visibility: visible;
          }
          #bordereau-seller {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-before-page {
            break-before: page;
          }
        }
      `}</style>
    </div>
  );
}
