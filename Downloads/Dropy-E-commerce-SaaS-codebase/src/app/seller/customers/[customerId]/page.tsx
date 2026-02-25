"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, Calendar, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface CustomerDetails {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_governorate: string;
  customer_address: string;
  orders: Order[];
  total_spent: number;
  first_order_date: string;
  last_order_date: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Nouvelle", variant: "default" },
  confirmed: { label: "Confirmée", variant: "secondary" },
  preparing: { label: "En préparation", variant: "secondary" },
  shipped: { label: "Expédiée", variant: "outline" },
  delivered: { label: "Livrée", variant: "default" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("seller_id", user.id)
        .single();

      if (!store) {
        setLoading(false);
        return;
      }

      const customerId = decodeURIComponent(params.customerId as string);

      const { data: orders } = await supabase
        .from("store_orders")
        .select("*")
        .eq("store_id", store.id)
        .or(`customer_email.eq.${customerId},customer_phone.eq.${customerId}`)
        .order("created_at", { ascending: false });

        if (orders && orders.length > 0) {
          const firstOrder = orders[orders.length - 1];
          const lastOrder = orders[0];
          
          const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

          const orderIds = orders.map(o => o.id);
          const { data: allItems } = await supabase
            .from("store_order_items")
            .select("store_order_id, product_name, quantity, unit_price")
            .in("store_order_id", orderIds);

          const itemsByOrder: Record<string, OrderItem[]> = {};
          allItems?.forEach(item => {
            if (!itemsByOrder[item.store_order_id]) {
              itemsByOrder[item.store_order_id] = [];
            }
            itemsByOrder[item.store_order_id].push({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price
            });
          });

          setCustomer({
            customer_name: firstOrder.customer_name || "Client",
            customer_email: firstOrder.customer_email || "",
            customer_phone: firstOrder.customer_phone || "",
            customer_governorate: firstOrder.customer_governorate || "",
            customer_address: firstOrder.customer_address || "",
            orders: orders.map(o => ({
              id: o.id,
              total_amount: Number(o.total_amount) || 0,
              status: o.status,
              created_at: o.created_at,
              items: itemsByOrder[o.id] || [],
            })),
            total_spent: totalSpent,
            first_order_date: firstOrder.created_at,
            last_order_date: lastOrder.created_at,
          });
        }
      
      setLoading(false);
    }
    
    loadCustomer();
  }, [params.customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="text-center py-20">
          <p className="text-lg font-semibold">Client introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Retour aux clients
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                  {customer.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{customer.customer_name}</h2>
                  <p className="text-sm text-muted-foreground">Client depuis {format(new Date(customer.first_order_date), "MMMM yyyy", { locale: fr })}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                {customer.customer_email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.customer_email}</span>
                  </div>
                )}
                {customer.customer_phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.customer_phone}</span>
                  </div>
                )}
                {customer.customer_governorate && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.customer_governorate}</span>
                  </div>
                )}
                {customer.customer_address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{customer.customer_address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="text-sm">Total commandes</span>
                </div>
                <span className="font-bold">{customer.orders.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Total dépensé</span>
                </div>
                <span className="font-bold text-green-600">{customer.total_spent.toFixed(2)} TND</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Dernière commande</span>
                </div>
                <span className="font-medium text-sm">{format(new Date(customer.last_order_date), "dd MMM yyyy", { locale: fr })}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Historique des commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.orders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/seller/orders/${order.id}`}
                    className="block p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">#{order.id.slice(0, 8)}</span>
                        <Badge variant={statusConfig[order.status]?.variant || "default"}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-primary">{order.total_amount.toFixed(2)} TND</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{format(new Date(order.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</span>
                      <span>{order.items?.length || 0} article(s)</span>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dashed">
                        <div className="flex flex-wrap gap-2">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                              {item.product_name} x{item.quantity}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{order.items.length - 3} autres</span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
