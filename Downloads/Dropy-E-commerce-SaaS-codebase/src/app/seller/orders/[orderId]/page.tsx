"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  ExternalLink,
  Copy,
  Tag,
  Sparkles,
  Info,
  Send,
  MessageSquare,
  XCircle,
  ChevronRight,
  Box
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createClient } from "@/lib/supabase/client";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  fulfillment_type: "own" | "dropshipping";
  item_status: string;
  supplier_id?: string;
  supplier_name?: string;
  variant_info?: Record<string, string>;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address: string;
  customer_governorate?: string;
  customer_note?: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  discount_amount?: number;
  status: string;
  payment_method: string;
  payment_status?: string;
  created_at: string;
  tracking_number?: string;
  shipping_company?: string;
  has_own_products: boolean;
  has_dropshipping_products: boolean;
  own_products_status: string;
  dropshipping_status: string;
  pickup_scheduled_at?: string;
  pickup_slot?: string;
  delivery_type?: string;
  seller_notes?: string;
  items: OrderItem[];
}

interface DropshippingTimeline {
  timestamp: string;
  status: string;
  description: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-cyan-100 text-cyan-700",
  preparing: "bg-orange-100 text-orange-700",
  prepared: "bg-purple-100 text-purple-700",
  ready_to_ship: "bg-purple-100 text-purple-700",
  pickup_scheduled: "bg-indigo-100 text-indigo-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  new: "Nouvelle",
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  prepared: "Préparé",
  ready_to_ship: "Prêt à expédier",
  pickup_scheduled: "Enlèvement programmé",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const ownStatusSteps = [
  { key: "pending", label: "En attente", icon: Clock },
  { key: "prepared", label: "Préparé", icon: Package },
  { key: "pickup_scheduled", label: "Enlèvement programmé", icon: Truck },
  { key: "shipped", label: "Expédié", icon: Send },
  { key: "delivered", label: "Livré", icon: CheckCircle2 },
];

const dropStatusSteps = [
  { key: "pending", label: "Transmis", icon: Send },
  { key: "accepted", label: "Accepté", icon: CheckCircle2 },
  { key: "preparing", label: "En préparation", icon: Package },
  { key: "ready", label: "Prêt", icon: Box },
  { key: "shipped", label: "En transit", icon: Truck },
  { key: "delivered", label: "Livré", icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showOwnDeliveryModal, setShowOwnDeliveryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sellerNote, setSellerNote] = useState("");
  const [pickupData, setPickupData] = useState({
    date: "",
    slot: "afternoon",
    weight: "small",
  });
  const [ownDeliveryData, setOwnDeliveryData] = useState({
    carrier: "",
    trackingNumber: "",
  });

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("store_orders")
        .select(`
          *,
          items:store_order_items(*)
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;

      const ownItems = data.items?.filter((i: OrderItem) => i.fulfillment_type === "own" || !i.fulfillment_type) || [];
      const dropItems = data.items?.filter((i: OrderItem) => i.fulfillment_type === "dropshipping") || [];

      setOrder({
        ...data,
        has_own_products: data.has_own_products || ownItems.length > 0,
        has_dropshipping_products: data.has_dropshipping_products || dropItems.length > 0,
        own_products_status: data.own_products_status || "pending",
        dropshipping_status: data.dropshipping_status || "pending",
      });
      setSellerNote(data.seller_notes || "");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Commande non trouvée");
      router.push("/seller/orders");
    } finally {
      setLoading(false);
    }
  }

  async function markAsPrepared() {
    if (!order) return;
    setProcessing(true);
    try {
      const supabase = createClient();
      await supabase
        .from("store_orders")
        .update({
          status: "preparing",
          own_products_status: "prepared",
        })
        .eq("id", order.id);

      toast.success("Commande marquée comme préparée");
      loadOrder();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setProcessing(false);
    }
  }

  async function schedulePickup() {
    if (!order || !pickupData.date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }
    setProcessing(true);
    try {
      const supabase = createClient();
      const trackingNumber = `DRP-${Date.now().toString(36).toUpperCase()}`;
      
      await supabase
        .from("store_orders")
        .update({
          status: "ready_to_ship",
          own_products_status: "pickup_scheduled",
          delivery_type: "dropy",
          pickup_scheduled_at: new Date(pickupData.date).toISOString(),
          pickup_slot: pickupData.slot,
          tracking_number: trackingNumber,
          shipping_company: "Dropy Livraison",
        })
        .eq("id", order.id);

      toast.success("Enlèvement programmé avec succès!");
      setShowPickupModal(false);
      loadOrder();
    } catch (error) {
      toast.error("Erreur lors de la programmation");
    } finally {
      setProcessing(false);
    }
  }

  async function useOwnDelivery() {
    if (!order) return;
    setProcessing(true);
    try {
      const supabase = createClient();
      
      await supabase
        .from("store_orders")
        .update({
          status: "shipped",
          own_products_status: "shipped",
          delivery_type: "own",
          tracking_number: ownDeliveryData.trackingNumber || null,
          shipping_company: ownDeliveryData.carrier || "Livraison propre",
          shipped_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      toast.success("Commande marquée comme expédiée");
      setShowOwnDeliveryModal(false);
      loadOrder();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setProcessing(false);
    }
  }

  async function markAsDelivered() {
    if (!order) return;
    setProcessing(true);
    try {
      const supabase = createClient();
      
      await supabase
        .from("store_orders")
        .update({
          status: "delivered",
          own_products_status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      toast.success("Commande marquée comme livrée");
      loadOrder();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setProcessing(false);
    }
  }

  async function saveNote() {
    if (!order) return;
    try {
      const supabase = createClient();
      await supabase
        .from("store_orders")
        .update({ seller_notes: sellerNote })
        .eq("id", order.id);
      toast.success("Note enregistrée");
    } catch (error) {
      toast.error("Erreur");
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié");
  };

  const getOwnStatusIndex = () => {
    if (!order) return 0;
    const idx = ownStatusSteps.findIndex(s => s.key === order.own_products_status);
    return idx >= 0 ? idx : 0;
  };

  const getDropStatusIndex = () => {
    if (!order) return 0;
    const idx = dropStatusSteps.findIndex(s => s.key === order.dropshipping_status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const ownItems = order.items?.filter(i => i.fulfillment_type === "own" || !i.fulfillment_type) || [];
  const dropItems = order.items?.filter(i => i.fulfillment_type === "dropshipping") || [];
  const subtotal = order.items?.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0) || 0;
  const shipping = order.shipping_cost || 7;

  const getNextPickupDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 5; i++) {
      const date = addDays(today, i);
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates.slice(0, 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/seller/orders")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">Commande {order.order_number}</h1>
            <Badge className={`${statusColors[order.status]} text-sm`}>
              {statusLabels[order.status]}
            </Badge>
            {order.has_own_products && order.has_dropshipping_products && (
              <Badge className="bg-gradient-to-r from-amber-100 to-purple-100 text-amber-800 border-amber-200">
                Commande Mixte
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(order.created_at), "EEEE d MMMM yyyy à HH:mm", { locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {order.has_own_products && order.has_dropshipping_products && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Commande avec 2 types de produits</p>
              <p className="text-sm text-amber-700 mt-1">
                Le client recevra peut-être 2 colis séparés: un de vos produits et un du fournisseur.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut</span>
                <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paiement</span>
                <span className={order.payment_status === "paid" ? "text-green-600 font-medium" : ""}>
                  {order.payment_method === "cod" ? "À la livraison" : "✅ Payé"}
                </span>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{subtotal.toFixed(2)} TND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{shipping} TND</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span>
                  <span>-{order.discount_amount} TND</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{order.total_amount} TND</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{order.customer_name}</p>
                {order.customer_email && (
                  <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                )}
              </div>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${order.customer_phone}`} className="hover:text-primary">
                  {order.customer_phone}
                </a>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.customer_phone!)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                ADRESSE DE LIVRAISON
              </p>
              <p className="text-sm">{order.customer_address}</p>
              {order.customer_governorate && (
                <p className="text-sm text-muted-foreground">{order.customer_governorate}</p>
              )}
            </div>
            {order.customer_note && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-medium text-amber-700 mb-1">Note du client:</p>
                <p className="text-sm text-amber-800">{order.customer_note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {order.tracking_number && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs font-medium text-indigo-600 mb-1">N° de suivi</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-indigo-800">{order.tracking_number}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.tracking_number!)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-indigo-600 mt-1">{order.shipping_company}</p>
              </div>
              {order.pickup_scheduled_at && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Enlèvement prévu:</p>
                  <p className="font-medium">
                    {format(new Date(order.pickup_scheduled_at), "EEEE d MMMM", { locale: fr })}
                    {order.pickup_slot === "morning" ? " (9h-12h)" : " (14h-18h)"}
                  </p>
                </div>
              )}
              <Link href={`/track/${order.order_number}`} target="_blank">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Voir le suivi complet
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {order.has_own_products && ownItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Tag className="w-5 h-5" />
                  Mes Produits à Expédier
                </CardTitle>
                <CardDescription>
                  Cette partie est sous votre responsabilité. Vous devez préparer et expédier ces produits.
                </CardDescription>
              </div>
              {["pending", "confirmed"].includes(order.status) && (
                <Badge className="bg-red-500 text-white animate-pulse">ACTION REQUISE</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">Statut:</span>
              <Badge className={statusColors[order.own_products_status] || "bg-gray-100"}>
                {statusLabels[order.own_products_status] || order.own_products_status}
              </Badge>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {ownStatusSteps.map((step, index) => {
                const currentIdx = getOwnStatusIndex();
                const isCompleted = index < currentIdx;
                const isCurrent = index === currentIdx;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted ? "bg-green-500 text-white" :
                        isCurrent ? "bg-primary text-white ring-4 ring-primary/20" :
                        "bg-gray-200 text-gray-400"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs mt-2 ${isCurrent ? "font-bold text-primary" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < ownStatusSteps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border rounded-xl overflow-hidden bg-white">
              <table className="w-full">
                <thead className="bg-amber-100/50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase">Produit</th>
                    <th className="py-3 px-4 text-center text-xs font-bold uppercase">Qté</th>
                    <th className="py-3 px-4 text-right text-xs font-bold uppercase">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {ownItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.product_image ? (
                            <img src={item.product_image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            {item.product_sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                            )}
                            {item.variant_info && Object.keys(item.variant_info).length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {Object.entries(item.variant_info).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{(item.unit_price * item.quantity).toFixed(2)} TND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {order.own_products_status === "pending" && (
              <div className="p-4 bg-white rounded-xl border space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
                  Préparer le colis
                </h4>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="prepared"
                    checked={isPrepared}
                    onCheckedChange={(v) => setIsPrepared(v === true)}
                  />
                  <label htmlFor="prepared" className="text-sm">
                    J'ai préparé et emballé les produits
                  </label>
                </div>
                <Button variant="outline" className="gap-2" size="sm">
                  <Printer className="w-4 h-4" />
                  Imprimer bon de préparation
                </Button>
                <Button 
                  className="w-full gap-2" 
                  disabled={!isPrepared || processing}
                  onClick={markAsPrepared}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Marquer comme préparé
                </Button>
              </div>
            )}

            {order.own_products_status === "prepared" && (
              <div className="p-4 bg-white rounded-xl border space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
                  Choisir le mode de livraison
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div 
                    className="p-4 border-2 rounded-xl cursor-pointer hover:border-primary transition-all"
                    onClick={() => setShowPickupModal(true)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">Livraison Dropy</p>
                        <p className="text-xs text-green-600">Recommandé</p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-13">
                      <li>• Dropy envoie un livreur chez vous</li>
                      <li>• Coût: 7 TND (inclus)</li>
                      <li>• Tracking automatique</li>
                    </ul>
                    <Button className="w-full mt-4 gap-2">
                      <Send className="w-4 h-4" />
                      Programmer l'enlèvement
                    </Button>
                  </div>

                  <div 
                    className="p-4 border rounded-xl cursor-pointer hover:border-gray-300 transition-all"
                    onClick={() => setShowOwnDeliveryModal(true)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="font-bold">Ma propre livraison</p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-13">
                      <li>• Vous gérez le livreur</li>
                      <li>• Mise à jour manuelle du statut</li>
                      <li>• Vous définissez le tracking</li>
                    </ul>
                    <Button variant="outline" className="w-full mt-4 gap-2">
                      <Truck className="w-4 h-4" />
                      J'utilise ma livraison
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {order.own_products_status === "shipped" && order.delivery_type === "own" && (
              <div className="p-4 bg-white rounded-xl border">
                <Button onClick={markAsDelivered} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Marquer comme livré
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {order.has_dropshipping_products && dropItems.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Sparkles className="w-5 h-5" />
                  Produits Dropshipping
                  <Badge className="bg-purple-200 text-purple-700 ml-2">AUTOMATIQUE</Badge>
                </CardTitle>
                <CardDescription>
                  Ces produits sont gérés automatiquement. Le fournisseur prépare et Dropy livre.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-purple-100/50 rounded-xl border border-purple-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Vous n'avez rien à faire</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Le fournisseur prépare le colis et Dropy s'occupe de la livraison. Les statuts se mettent à jour automatiquement.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">Statut:</span>
              <Badge className="bg-purple-100 text-purple-700">
                {dropStatusSteps.find(s => s.key === order.dropshipping_status)?.label || order.dropshipping_status}
              </Badge>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {dropStatusSteps.map((step, index) => {
                const currentIdx = getDropStatusIndex();
                const isCompleted = index < currentIdx;
                const isCurrent = index === currentIdx;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted ? "bg-green-500 text-white" :
                        isCurrent ? "bg-purple-600 text-white ring-4 ring-purple-200" :
                        "bg-gray-200 text-gray-400"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs mt-2 ${isCurrent ? "font-bold text-purple-600" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < dropStatusSteps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border rounded-xl overflow-hidden bg-white">
              <table className="w-full">
                <thead className="bg-purple-100/50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase">Produit</th>
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase">Fournisseur</th>
                    <th className="py-3 px-4 text-center text-xs font-bold uppercase">Qté</th>
                    <th className="py-3 px-4 text-right text-xs font-bold uppercase">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {dropItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.product_image ? (
                            <img src={item.product_image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <Badge variant="outline" className="text-[10px] mt-1">Dropshipping</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {item.supplier_name || "Fournisseur Dropy"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{(item.unit_price * item.quantity).toFixed(2)} TND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes internes
          </CardTitle>
          <CardDescription>Notes privées (non visibles par le client)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={sellerNote}
            onChange={(e) => setSellerNote(e.target.value)}
            placeholder="Ajouter une note privée..."
            rows={3}
          />
          <Button variant="outline" size="sm" onClick={saveNote}>
            Enregistrer la note
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Phone className="w-4 h-4" />
            Contacter le client
          </Button>
          <Button variant="outline" className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50">
            <AlertCircle className="w-4 h-4" />
            Signaler un problème
          </Button>
        </div>
        <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
          <XCircle className="w-4 h-4" />
          Annuler la commande
        </Button>
      </div>

      <Dialog open={showPickupModal} onOpenChange={setShowPickupModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Programmer un enlèvement
            </DialogTitle>
            <DialogDescription>
              Commande {order.order_number} - {ownItems.length} article(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-bold mb-2">Adresse d'enlèvement</p>
              <p className="text-sm text-muted-foreground">
                Votre adresse enregistrée sera utilisée.
              </p>
              <Link href="/seller/settings" className="text-xs text-primary hover:underline">
                Modifier l'adresse →
              </Link>
            </div>

            <div>
              <Label className="font-bold mb-3 block">Date d'enlèvement</Label>
              <div className="grid grid-cols-4 gap-2">
                {getNextPickupDates().map((date) => (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => setPickupData(prev => ({ ...prev, date: date.toISOString().split("T")[0] }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      pickupData.date === date.toISOString().split("T")[0]
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {format(date, "EEE", { locale: fr })}
                    </p>
                    <p className="font-bold">{format(date, "d", { locale: fr })}</p>
                    <p className="text-xs">{format(date, "MMM", { locale: fr })}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="font-bold mb-3 block">Créneau horaire</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "morning", label: "09:00 - 12:00", sub: "Matin" },
                  { id: "afternoon", label: "14:00 - 18:00", sub: "Après-midi" },
                ].map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setPickupData(prev => ({ ...prev, slot: slot.id }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      pickupData.slot === slot.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="font-bold">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex justify-between text-sm mb-2">
                <span>Enlèvement:</span>
                <span className="font-medium">
                  {pickupData.date ? format(new Date(pickupData.date), "EEEE d MMMM", { locale: fr }) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Livraison estimée:</span>
                <span className="font-medium">
                  {pickupData.date ? format(addDays(new Date(pickupData.date), 1), "d-", { locale: fr }) + format(addDays(new Date(pickupData.date), 2), "d MMM", { locale: fr }) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-green-200">
                <span>Coût:</span>
                <span className="font-bold text-green-700">7 TND (inclus dans la commande)</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPickupModal(false)}>Annuler</Button>
            <Button onClick={schedulePickup} disabled={!pickupData.date || processing} className="gap-2">
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirmer l'enlèvement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOwnDeliveryModal} onOpenChange={setShowOwnDeliveryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Ma propre livraison
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de votre transporteur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nom du transporteur (optionnel)</Label>
              <Input
                value={ownDeliveryData.carrier}
                onChange={(e) => setOwnDeliveryData(prev => ({ ...prev, carrier: e.target.value }))}
                placeholder="Ex: Aramex, DHL..."
              />
            </div>
            <div>
              <Label>Numéro de suivi (optionnel)</Label>
              <Input
                value={ownDeliveryData.trackingNumber}
                onChange={(e) => setOwnDeliveryData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Ex: TRK-123456"
              />
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Vous devrez mettre à jour manuellement le statut de livraison.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOwnDeliveryModal(false)}>Annuler</Button>
            <Button onClick={useOwnDelivery} disabled={processing} className="gap-2">
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Marquer comme expédié
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
