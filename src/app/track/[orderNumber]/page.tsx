"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Phone,
  ArrowLeft,
  Copy,
  ExternalLink,
  ShoppingBag,
  User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { storeUrl } from "@/lib/store-url";
import { whatsappLink } from "@/lib/order-messages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
}

interface OrderTracking {
  id: string;
  order_number: string;
  status: string;
  tracking_number?: string;
  shipping_company?: string;
  estimated_delivery?: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_governorate?: string;
  total_amount: number;
  payment_method: string;
  items: OrderItem[];
  store?: {
    name: string;
    logo_url?: string;
    slug?: string;
    whatsapp_number?: string | null;
  };
}

const statusSteps = [
  { key: 'new', label: 'Commande reçue', icon: ShoppingBag },
  { key: 'confirmed', label: 'Confirmée', icon: CheckCircle2 },
  { key: 'preparing', label: 'En préparation', icon: Package },
  { key: 'shipped', label: 'En transit', icon: Truck },
  { key: 'delivered', label: 'Livré', icon: CheckCircle2 },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  confirmed: "bg-yellow-500",
  preparing: "bg-orange-500",
  ready_to_ship: "bg-purple-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function TrackOrderPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(false);

  useEffect(() => {
    loadOrderTracking();
  }, [orderNumber]);

  async function fetchOrder(phone?: string) {
    const params = new URLSearchParams({ number: orderNumber });
    if (phone) params.set("phone", phone);
    const response = await fetch(`/api/store/orders/track?${params}`);
    if (!response.ok) return null;
    return (await response.json()) as { order: OrderTracking; verified: boolean };
  }

  async function loadOrderTracking() {
    try {
      const result = await fetchOrder();
      if (!result) {
        setError("Commande non trouvée");
        return;
      }
      setOrder({ ...result.order, items: result.order.items || [] });
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function verifyWithPhone(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(false);
    const result = await fetchOrder(verifyPhone).catch(() => null);
    if (result?.verified) {
      setOrder({ ...result.order, items: result.order.items || [] });
    } else {
      setVerifyError(true);
    }
    setVerifying(false);
  }

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = statusSteps.findIndex(s => s.key === order.status);
    return index >= 0 ? index : 0;
  };

  const copyTrackingNumber = () => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      toast.success("Numéro de suivi copié");
    }
  };

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      toast.success("Numéro de commande copié");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold mb-2">Commande non trouvée</h2>
            <p className="text-muted-foreground mb-6">
              Vérifiez le numéro de commande ou de suivi et réessayez.
            </p>
            <Link href="/">
              <Button className="rounded-full">Retour à l&apos;accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href={order.store?.slug ? storeUrl(order.store.slug) : "/"} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour à la boutique</span>
          </a>
          <div className="flex items-center gap-2">
            {order.store?.logo_url ? <img src={order.store.logo_url} alt="" className="w-6 h-6 rounded" /> : <ShoppingBag className="w-5 h-5 text-primary" />}
            <span className="font-bold">{order.store?.name || "Suivi de commande"}</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className={`h-2 ${statusColors[order.status]}`} />
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                {order.store && (
                  <div className="flex items-center gap-2 mb-2">
                    {order.store.logo_url ? (
                      <img src={order.store.logo_url} alt="" className="w-6 h-6 rounded" />
                    ) : (
                      <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                        <ShoppingBag className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-muted-foreground">{order.store.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-primary">{order.order_number}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyOrderNumber}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Commandé le {format(new Date(order.created_at), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <Badge className={`${statusColors[order.status]} text-white px-4 py-2 text-sm shadow-md`}>
                {statusSteps.find(s => s.key === order.status)?.label || order.status}
              </Badge>
            </div>

            {order.tracking_number && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl mb-6 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-600 font-medium mb-1">Numéro de suivi</p>
                    <code className="text-lg font-mono font-bold text-indigo-900">{order.tracking_number}</code>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyTrackingNumber} className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copier
                  </Button>
                </div>
                {order.shipping_company && (
                  <div className="mt-3 pt-3 border-t border-indigo-100">
                    <p className="text-xs text-indigo-600">
                      <Truck className="w-3 h-3 inline mr-1" />
                      Transporteur: <span className="font-medium">{order.shipping_company === "dropy_internal" ? "Livraison Dropy" : order.shipping_company}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {order.estimated_delivery && order.status !== 'delivered' && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Livraison estimée</p>
                    <p className="text-lg font-bold text-green-800">
                      {format(new Date(order.estimated_delivery), "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative py-4">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                const StepIcon = step.icon;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start mb-8 last:mb-0 relative"
                  >
                    <div className="relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted 
                            ? isCurrent 
                              ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' 
                              : 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    <div className="ml-4 pt-2 flex-1">
                      <p className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-primary mt-1 animate-pulse">
                          Statut actuel
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {order.items && order.items.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Articles ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                    </div>
                    <p className="font-bold">{formatPrice(item.unit_price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(order.total_amount)}</span>
              </div>
              {order.payment_method === 'cod' && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 font-medium">
                    💵 Paiement à la livraison
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-0">
          <CardContent className="pt-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Adresse de livraison
            </h3>
            {order.customer_name ? (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.customer_name}</p>
                    {order.customer_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground pl-13">
                  {order.customer_address}
                  {order.customer_governorate && `, ${order.customer_governorate}`}
                </p>
              </div>
            ) : (
              <form onSubmit={verifyWithPhone} className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pour afficher l&apos;adresse de livraison, saisissez le numéro de téléphone utilisé lors de la commande.
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={verifyPhone}
                    onChange={(e) => setVerifyPhone(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                    className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                  />
                  <Button type="submit" disabled={verifying || verifyPhone.replace(/\D/g, "").length < 8}>
                    Vérifier
                  </Button>
                </div>
                {verifyError && <p className="text-xs text-red-600">Numéro incorrect.</p>}
              </form>
            )}
          </CardContent>
        </Card>

        {order.store?.whatsapp_number && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">
              Besoin d&apos;aide avec votre commande ?
            </p>
            <a href={whatsappLink(order.store.whatsapp_number, `Bonjour, j'ai une question sur ma commande ${order.order_number}.`)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full gap-2">
                <Phone className="w-4 h-4" />
                Contacter la boutique
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
