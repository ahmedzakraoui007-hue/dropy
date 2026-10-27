"use client";

import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Users, Search, Download, Mail, Phone, ShoppingBag, MapPin, ChevronRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
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
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.customers_page.${key}`);
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
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true }).limit(1).maybeSingle();

      if (!store) {
        setLoading(false);
        return;
      }

      const { data: orders } = await supabase
        .from("store_orders")
        .select("customer_email, customer_name, customer_phone, customer_governorate, total_amount, created_at, status")
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
            if (order.status !== "cancelled") existing.total_spent += Number(order.total_amount) || 0;
          } else {
            customerMap.set(key, {
              customer_email: order.customer_email || "",
              customer_name: order.customer_name || "—",
              customer_phone: order.customer_phone || "",
              customer_governorate: order.customer_governorate || "",
              total_orders: 1,
              total_spent: order.status === "cancelled" ? 0 : Number(order.total_amount) || 0,
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

  const exportCsv = () => {
    const header = [tr("csv_name"), tr("csv_phone"), tr("csv_email"), tr("csv_governorate"), tr("csv_orders"), tr("csv_spent"), tr("csv_last")];
    const rows = filteredCustomers.map((c) => [c.customer_name, c.customer_phone, c.customer_email, c.customer_governorate, String(c.total_orders), c.total_spent.toFixed(3), c.last_order_date.slice(0, 10)]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "clients.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tr("title")}</h1>
          <p className="text-muted-foreground">{tr("subtitle")}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={filteredCustomers.length === 0}>
          <Download className="w-4 h-4" />
          {tr("export")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={tr("search")}
                className="ps-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">{tr("loading")}</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-semibold">{tr("empty_title")}</p>
              <p className="text-muted-foreground">{tr("empty_text")}</p>
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
                      <div className="text-end">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          {customer.total_orders} {tr(customer.total_orders > 1 ? "orders" : "order")}
                        </div>
                        <p className="text-lg font-bold text-primary">{formatPrice(customer.total_spent)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
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
