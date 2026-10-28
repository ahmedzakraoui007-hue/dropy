"use client";

import { sellerConfirmationMessage, whatsappLink } from "@/lib/order-messages";
import { useTranslation } from "@/context/LanguageContext";
import { phoneKey } from "@/lib/order-protection";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
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
  Box,
  ShieldAlert,
  Ban
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
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { format, addDays } from "date-fns";
import { arTN, fr } from "date-fns/locale";
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
  store_id: string;
  order_number: string;
  risk_flags?: string[] | null;
  customer_ip?: string | null;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address: string;
  customer_governorate?: string;
  notes?: string | null;
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
  cancel_reason?: string | null;
  items: OrderItem[];
  store?: { name: string; storefront_language: string | null } | null;
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

const CANCEL_REASON_LABELS: Record<string, string> = {
  unreachable: "Client injoignable",
  customer_cancelled: "Le client a annulé",
  fake_order: "Fausse commande",
  out_of_stock: "Rupture de stock",
  other: "Autre raison",
};

const phoneDigits = (phone: string | null | undefined) => String(phone || "").replace(/\D/g, "").replace(/^216/, "");

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
  const { t, locale } = useTranslation();
  const tx = (key: string) => t(`seller_app.order_detail.${key}`);
  const tl = (group: string, key: string) => {
    const path = `seller_app.order_detail.${group}.${key}`;
    const value = t(path);
    return value === path ? key : value;
  };
  const dateLocale = locale === "ar" ? arTN : fr;
  const [blocking, setBlocking] = useState(false);

  async function blockCustomer() {
    if (!order) return;
    setBlocking(true);
    const rows = [
      ...(order.customer_phone ? [{ store_id: order.store_id, kind: "phone", value: phoneKey(order.customer_phone), note: order.order_number }] : []),
      ...(order.customer_ip ? [{ store_id: order.store_id, kind: "ip", value: order.customer_ip, note: order.order_number }] : []),
    ].filter((row) => row.value);
    const { error } = rows.length
      ? await createBrowserClient().from("store_blocklist").upsert(rows, { onConflict: "store_id,kind,value" })
      : { error: null };
    setBlocking(false);
    if (error) toast.error(t("seller_app.protection.save_error"));
    else toast.success(t("seller_app.protection.blocked_done"));
  }
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("unreachable");
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
          items:store_order_items(*),
          store:stores(name, storefront_language)
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
      toast.error(tx("not_found"));
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

      toast.success(tx("marked_prepared"));
      loadOrder();
    } catch (error) {
      toast.error(tx("update_error"));
    } finally {
      setProcessing(false);
    }
  }

  async function schedulePickup() {
    if (!order || !pickupData.date) {
      toast.error(tx("pick_date"));
      return;
    }
    setProcessing(true);
    try {
      const supabase = createClient();
      const trackingNumber = `DRP-${Date.now().toString(36).toUpperCase()}`;
      
      await supabase
        .from("store_orders")
        .update({
          status: "preparing",
          own_products_status: "pickup_scheduled",
          delivery_type: "dropy",
          pickup_scheduled_at: new Date(pickupData.date).toISOString(),
          pickup_slot: pickupData.slot,
          tracking_number: trackingNumber,
          shipping_company: "Dropy Livraison",
        })
        .eq("id", order.id);

      toast.success(tx("pickup_scheduled_ok"));
      setShowPickupModal(false);
      loadOrder();
    } catch (error) {
      toast.error(tx("pickup_error"));
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
          shipping_company: ownDeliveryData.carrier || tx("own_delivery"),
          shipped_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      toast.success(tx("marked_shipped"));
      setShowOwnDeliveryModal(false);
      loadOrder();
    } catch (error) {
      toast.error(tx("update_error"));
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
          ...(order.payment_method === "cod" ? { payment_status: "paid" } : {}),
        })
        .eq("id", order.id);

      toast.success(tx("marked_delivered"));
      loadOrder();
    } catch (error) {
      toast.error(tx("error"));
    } finally {
      setProcessing(false);
    }
  }

  async function updateOrderStatus(action: "confirm" | "cancel") {
    if (!order) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/seller/orders/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "cancel" ? { action, reason: cancelReason } : { action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Erreur");
      toast.success(tx(action === "confirm" ? "confirmed_toast" : "cancelled_toast"));
      setCancelOpen(false);
      await loadOrder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tx("update_error"));
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
      toast.success(tx("note_saved"));
    } catch (error) {
      toast.error(tx("error"));
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tx("copied"));
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

  const awaitingConfirmation = order?.status === "new";

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
  const shipping = Number(order.shipping_cost ?? 0);

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
        <Button variant="ghost" size="icon" aria-label={tx("back")} onClick={() => router.push("/seller/orders")}>
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{tx("order")} {order.order_number}</h1>
            <Badge className={`${statusColors[order.status]} text-sm`}>
              {tl("status", order.status)}
            </Badge>
            {order.has_own_products && order.has_dropshipping_products && (
              <Badge className="bg-gradient-to-r from-amber-100 to-purple-100 text-amber-800 border-amber-200">
                {tx("mixed")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(order.created_at), "EEEE d MMMM yyyy, HH:mm", { locale: dateLocale })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            {tx("print")}
          </Button>
        </div>
      </div>

      {(order.risk_flags?.length ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-red-900">⚠ {t("seller_app.protection.suspicious")}</p>
                <ul className="text-sm text-red-800 list-disc ps-5">
                  {(order.risk_flags || []).map((flag) => (
                    <li key={flag}>{t(`seller_app.protection.flags.${flag}`)}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Button variant="outline" className="bg-white gap-2 text-red-700 border-red-200 shrink-0" disabled={blocking} onClick={blockCustomer}>
              <Ban className="w-4 h-4" />
              {t("seller_app.protection.block_customer")}
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === "new" && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-900">{tx("to_confirm_title")}</p>
                <p className="text-sm text-amber-800">
                  {tx("to_confirm_text")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {order.customer_phone && (
                <>
                  <Button asChild variant="outline" className="bg-white gap-2">
                    <a href={`tel:${order.customer_phone}`}><Phone className="w-4 h-4" />{tx("call")}</a>
                  </Button>
                  <Button asChild variant="outline" className="bg-white gap-2">
                    <a href={whatsappLink(order.customer_phone, sellerConfirmationMessage(order, order.store?.name || "", order.store?.storefront_language === "ar" ? "ar" : "fr"))} target="_blank" rel="noreferrer"><MessageSquare className="w-4 h-4" />WhatsApp</a>
                  </Button>
                </>
              )}
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={processing} onClick={() => updateOrderStatus("confirm")}>
                <CheckCircle2 className="w-4 h-4" />
                {tx("confirm")}
              </Button>
              <Button variant="outline" className="gap-2 bg-white text-red-600 border-red-200 hover:bg-red-50" disabled={processing} onClick={() => setCancelOpen(true)}>
                <XCircle className="w-4 h-4" />
                {tx("cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {order.dropshipping_status === "rejected" && order.status !== "cancelled" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div>
                <p className="font-bold text-red-900">{tx("supplier_rejected")}</p>
                <p className="text-sm text-red-800">{tx("supplier_rejected_text")}</p>
              </div>
            </div>
            <Button variant="outline" className="shrink-0 gap-2 border-red-200 bg-white text-red-700" onClick={() => { setCancelReason("out_of_stock"); setCancelOpen(true); }}>
              <XCircle className="h-4 w-4" />
              {tx("cancel_order")}
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === "cancelled" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-800">
            {tx("cancelled_banner")}{order.cancel_reason ? ` : ${tl("reasons", order.cancel_reason)}` : ""}.
          </CardContent>
        </Card>
      )}

      {order.has_own_products && order.has_dropshipping_products && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">{tx("mixed_title")}</p>
              <p className="text-sm text-amber-700 mt-1">
                {tx("mixed_text")}
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
              {tx("info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tx("date")}</span>
                <span>{format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tx("status_label")}</span>
                <Badge className={statusColors[order.status]}>{tl("status", order.status)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tx("payment")}</span>
                <span className={order.payment_status === "paid" ? "text-green-600 font-medium" : ""}>
                  {order.payment_method === "cod" ? tx("cod") : `✅ ${tx("paid")}`}
                </span>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tx("subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tx("delivery")}</span>
                <span>{Number(shipping) > 0 ? formatPrice(shipping) : tx("free")}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{tx("discount")}</span>
                  <span>-{formatPrice(order.discount_amount ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{tx("total")}</span>
                <span className="text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              {tx("customer")}
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
                {tx("address")}
              </p>
              <p className="text-sm">{order.customer_address}</p>
              {order.customer_governorate && (
                <p className="text-sm text-muted-foreground">{order.customer_governorate}</p>
              )}
            </div>
            {order.notes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-medium text-amber-700 mb-1">{t("seller_app.orders.customer_note")}</p>
                <p className="text-sm text-amber-800 whitespace-pre-line" dir="auto">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {order.tracking_number && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4" />
                {tx("delivery")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs font-medium text-indigo-600 mb-1">{tx("tracking_number")}</p>
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
                  <p className="text-muted-foreground">{tx("pickup_planned")}</p>
                  <p className="font-medium">
                    {format(new Date(order.pickup_scheduled_at), "EEEE d MMMM", { locale: dateLocale })}
                    {order.pickup_slot === "morning" ? " (9h-12h)" : " (14h-18h)"}
                  </p>
                </div>
              )}
              <Link href={`/track/${order.order_number}`} target="_blank">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {tx("full_tracking")}
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
                  {tx("own_title")}
                </CardTitle>
                <CardDescription>
                  {tx("own_text")}
                </CardDescription>
              </div>
              {["new", "confirmed"].includes(order.status) && (
                <Badge className="bg-red-500 text-white animate-pulse">{tx("action_required")}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">{tx("status_label")} :</span>
              <Badge className={statusColors[order.own_products_status] || "bg-gray-100"}>
                {tl("status", order.own_products_status)}
              </Badge>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {ownStatusSteps.map((step, index) => {
                const stepLabel = tl("own_steps", step.key);
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
                        {stepLabel}
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
                    <th className="py-3 px-4 text-start text-xs font-bold uppercase">{tx("product")}</th>
                    <th className="py-3 px-4 text-center text-xs font-bold uppercase">{tx("qty")}</th>
                    <th className="py-3 px-4 text-end text-xs font-bold uppercase">{tx("price")}</th>
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
                      <td className="py-3 px-4 text-end font-mono">{formatPrice(item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {order.own_products_status === "pending" && (
              <div className="p-4 bg-white rounded-xl border space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
                  {tx("prepare_title")}
                </h4>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="prepared"
                    checked={isPrepared}
                    onCheckedChange={(v) => setIsPrepared(v === true)}
                  />
                  <label htmlFor="prepared" className="text-sm">
                    {tx("prepared_check")}
                  </label>
                </div>
                <Button variant="outline" className="gap-2" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" />
                  {tx("print_slip")}
                </Button>
                {order.status === "new" && (
                  <p className="text-xs text-amber-700">Confirmez d&apos;abord la commande avec le client.</p>
                )}
                <Button
                  className="w-full gap-2"
                  disabled={!isPrepared || processing || order.status === "new"}
                  onClick={markAsPrepared}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {tx("mark_prepared")}
                </Button>
              </div>
            )}

            {order.own_products_status === "prepared" && (
              <div className="p-4 bg-white rounded-xl border space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
                  {tx("choose_delivery")}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border-2 border-dashed rounded-xl bg-muted/30" aria-disabled="true">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{tx("dropy_delivery")}</p>
                        <p className="text-xs font-semibold text-amber-600">{tx("soon")}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{tx("dropy_delivery_soon")}</p>
                  </div>

                  <div 
                    className="p-4 border-2 border-primary/40 rounded-xl cursor-pointer hover:border-primary transition-all"
                    onClick={() => setShowOwnDeliveryModal(true)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="font-bold">{tx("own_title_modal")}</p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-13">
                      <li>• {tx("own_1")}</li>
                      <li>• {tx("own_2")}</li>
                      <li>• {tx("own_3")}</li>
                    </ul>
                    <Button variant="outline" className="w-full mt-4 gap-2">
                      <Truck className="w-4 h-4" />
                      {tx("use_own")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {order.own_products_status === "shipped" && order.delivery_type === "own" && (
              <div className="p-4 bg-white rounded-xl border">
                <Button onClick={markAsDelivered} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  {tx("mark_delivered")}
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
                  {tx("drop_title")}
                  <Badge className="bg-purple-200 text-purple-700 ms-2">{tx("automatic")}</Badge>
                </CardTitle>
                <CardDescription>
                  {tx("drop_text")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-purple-100/50 rounded-xl border border-purple-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">{tx(awaitingConfirmation ? "drop_waiting_title" : "nothing_to_do")}</p>
                  <p className="text-sm text-purple-700 mt-1">
                    {tx(awaitingConfirmation ? "drop_waiting" : "drop_auto")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">{tx("status_label")} :</span>
              <Badge className="bg-purple-100 text-purple-700">
                {awaitingConfirmation ? tx("drop_waiting_badge") : tl("drop_steps", order.dropshipping_status)}
              </Badge>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {dropStatusSteps.map((step, index) => {
                const stepLabel = tl("drop_steps", step.key);
                const currentIdx = awaitingConfirmation ? -1 : getDropStatusIndex();
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
                        {stepLabel}
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
                    <th className="py-3 px-4 text-start text-xs font-bold uppercase">{tx("product")}</th>
                    <th className="py-3 px-4 text-start text-xs font-bold uppercase">{tx("supplier")}</th>
                    <th className="py-3 px-4 text-center text-xs font-bold uppercase">{tx("qty")}</th>
                    <th className="py-3 px-4 text-end text-xs font-bold uppercase">{tx("price")}</th>
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
                        {item.supplier_name || tx("dropy_supplier")}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-4 text-end font-mono">{formatPrice(item.unit_price * item.quantity)}</td>
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
            {tx("notes_title")}
          </CardTitle>
          <CardDescription>{tx("notes_help")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={sellerNote}
            onChange={(e) => setSellerNote(e.target.value)}
            placeholder={tx("notes_ph")}
            rows={3}
          />
          <Button variant="outline" size="sm" onClick={saveNote}>
            {tx("save_note")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
        <div className="flex flex-wrap gap-2">
          {order.customer_phone && (
            <Button asChild variant="outline" className="gap-2">
              <a href={`tel:${order.customer_phone}`}>
                <Phone className="w-4 h-4" />
                {tx("contact_customer")}
              </a>
            </Button>
          )}
          <Button asChild variant="outline" className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50">
            <Link href="/contact">
              <AlertCircle className="w-4 h-4" />
              {tx("report")}
            </Link>
          </Button>
        </div>
        {["new", "confirmed", "preparing"].includes(order.status) && (
          <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelOpen(true)}>
            <XCircle className="w-4 h-4" />
            {tx("cancel_order")}
          </Button>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tx("cancel_order")} {order.order_number}</DialogTitle>
            <DialogDescription>{tx("cancel_text")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{tx("reason")}</Label>
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CANCEL_REASON_LABELS).map((value) => (
                  <SelectItem key={value} value={value}>{tl("reasons", value)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>{tx("go_back")}</Button>
            <Button className="bg-red-600 hover:bg-red-700" disabled={processing} onClick={() => updateOrderStatus("cancel")}>
              {tx("cancel_order")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPickupModal} onOpenChange={setShowPickupModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              {tx("pickup_title")}
            </DialogTitle>
            <DialogDescription>
              {tx("order")} {order.order_number} · {ownItems.length} {tx("items")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-bold mb-2">{tx("pickup_address")}</p>
              <p className="text-sm text-muted-foreground">
                {tx("pickup_address_text")}
              </p>
              <Link href="/seller/settings" className="text-xs text-primary hover:underline">
                {tx("edit_address")}
              </Link>
            </div>

            <div>
              <Label className="font-bold mb-3 block">{tx("pickup_date")}</Label>
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
                      {format(date, "EEE", { locale: dateLocale })}
                    </p>
                    <p className="font-bold">{format(date, "d", { locale: dateLocale })}</p>
                    <p className="text-xs">{format(date, "MMM", { locale: dateLocale })}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="font-bold mb-3 block">{tx("slot")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "morning", label: "09:00 - 12:00", sub: tx("morning") },
                  { id: "afternoon", label: "14:00 - 18:00", sub: tx("afternoon") },
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
                <span>{tx("pickup")}</span>
                <span className="font-medium">
                  {pickupData.date ? format(new Date(pickupData.date), "EEEE d MMMM", { locale: dateLocale }) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{tx("eta")}</span>
                <span className="font-medium">
                  {pickupData.date ? format(addDays(new Date(pickupData.date), 1), "d-", { locale: dateLocale }) + format(addDays(new Date(pickupData.date), 2), "d MMM", { locale: dateLocale }) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-green-200">
                <span>{tx("cost")}</span>
                <span className="font-bold text-green-700">{tx("cost_value")}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPickupModal(false)}>{tx("cancel")}</Button>
            <Button onClick={schedulePickup} disabled={!pickupData.date || processing} className="gap-2">
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {tx("confirm_pickup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOwnDeliveryModal} onOpenChange={setShowOwnDeliveryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {tx("own_title_modal")}
            </DialogTitle>
            <DialogDescription>
              {tx("own_text_modal")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{tx("carrier")}</Label>
              <Input
                value={ownDeliveryData.carrier}
                onChange={(e) => setOwnDeliveryData(prev => ({ ...prev, carrier: e.target.value }))}
                placeholder={tx("carrier_ph")}
              />
            </div>
            <div>
              <Label>{tx("tracking_optional")}</Label>
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
                  {tx("manual_status")}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOwnDeliveryModal(false)}>{tx("cancel")}</Button>
            <Button onClick={useOwnDelivery} disabled={processing} className="gap-2">
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {tx("mark_shipped")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
