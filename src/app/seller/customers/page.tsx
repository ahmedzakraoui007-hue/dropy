"use client";

import { useEffect, useState } from "react";
import { Users, Search, Download, Filter, Mail, Phone, ShoppingBag, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Customer {
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  customer_governorate: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCustomers() {
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

      const { data: orders } = await supabase
        .from("store_orders")
        .select("customer_email, customer_name, customer_phone, customer_governorate, total_amount, created_at")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (orders && orders.length > 0) {
        const customerMap = new Map<string, Customer>();
        
        orders.forEach((order) => {
          const key = order.customer_email || order.customer_phone;
          if (!key) return;
          
          if (customerMap.has(key)) {
            const existing = customerMap.get(key)!;
            existing.total_orders += 1;
            existing.total_spent += Number(order.total_amount) || 0;
          } else {
            customerMap.set(key, {
              customer_email: order.customer_email || "",
              customer_name: order.customer_name || "Client",
              customer_phone: order.customer_phone || "",
              customer_governorate: order.customer_governorate || "",
              total_orders: 1,
              total_spent: Number(order.total_amount) || 0,
              last_order_date: order.created_at,
            });
          }
        });
        
        setCustomers(Array.from(customerMap.values()));
      }
      
      setLoading(false);
    }
    
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_email.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Gérez votre base de clients et leurs informations.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un client..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-semibold">Aucun client pour le moment</p>
              <p className="text-muted-foreground">Les clients apparaîtront ici dès qu&apos;ils passeront commande.</p>
            </div>
          ) : (
            <div className="space-y-3">
                {filteredCustomers.map((customer, index) => (
                  <Link 
                    key={index}
                    href={`/seller/customers/${encodeURIComponent(customer.customer_email || customer.customer_phone)}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {customer.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{customer.customer_name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                          {customer.customer_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {customer.customer_email}
                            </span>
                          )}
                          {customer.customer_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.customer_phone}
                            </span>
                          )}
                          {customer.customer_governorate && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {customer.customer_governorate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          {customer.total_orders} commande{customer.total_orders > 1 ? "s" : ""}
                        </div>
                        <p className="text-lg font-bold text-primary">{customer.total_spent.toFixed(2)} TND</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
