"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  History,
  TrendingUp,
  Download,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

export default function CreatorPaymentsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    available: 0,
    escrow: 0,
    total: 0
  });

  useEffect(() => {
    async function fetchPayments() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("content_payments")
        .select(`
          *,
          brief:content_briefs(title)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPayments(data);
        
        const available = data
          .filter(p => p.status === "released")
          .reduce((acc, p) => acc + (p.creator_amount || 0), 0);
        
        const escrow = data
          .filter(p => p.status === "escrowed")
          .reduce((acc, p) => acc + (p.creator_amount || 0), 0);
          
        setStats({
          available,
          escrow,
          total: available + escrow
        });
      }
      setIsLoading(false);
    }

    fetchPayments();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Earnings & Payments</h1>
            <p className="text-muted-foreground">Manage your revenue and withdrawals</p>
          </div>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600">
            Withdraw Funds
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium opacity-80">Available for Withdrawal</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.available.toFixed(2)} TND</h3>
                </div>
                <div className="p-2 bg-white/10 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Held in Escrow</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.escrow.toFixed(2)} TND</h3>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Lifetime Earnings</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.total.toFixed(2)} TND</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Recent payments and withdrawals</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-10" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            payment.status === "released" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                          )}>
                            {payment.status === "released" ? <ArrowDownLeft className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-semibold">{payment.brief?.title}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(payment.created_at), "PPp")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{payment.creator_amount} TND</p>
                          <Badge variant={payment.status === "released" ? "default" : "secondary"} className="text-[10px] h-5">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-border/50 bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bank Transfer</p>
                      <p className="text-xs text-muted-foreground">Main account</p>
                    </div>
                  </div>
                  <Badge variant="outline">Default</Badge>
                </div>
                <Button variant="outline" className="w-full text-xs">Manage Methods</Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-bold">Payment Schedule</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Withdrawals are processed every Tuesday and Thursday. Minimum withdrawal amount is 50 TND.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
