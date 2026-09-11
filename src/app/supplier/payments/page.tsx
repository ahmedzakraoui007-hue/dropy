"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowDownRight,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaymentInfo {
  bankName: string;
  accountName: string;
  rib: string;
}

interface Payout {
  id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  reference: string;
}

export default function SupplierPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({
    available: 1250.00,
    pending: 450.00,
    total: 1700.00
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    bankName: "",
    accountName: "",
    rib: ""
  });
  const [payouts, setPayouts] = useState<Payout[]>([
    { id: "1", amount: 500, status: "completed", createdAt: "2025-01-10", reference: "PAY-001" },
    { id: "2", amount: 300, status: "completed", createdAt: "2025-01-05", reference: "PAY-002" },
    { id: "3", amount: 200, status: "pending", createdAt: "2025-01-14", reference: "PAY-003" },
  ]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: payments } = await supabase
          .from("payments")
          .select("supplier_amount, status")
          .eq("supplier_id", user.id);

        if (payments) {
          const pending = payments
            .filter(p => p.status === "pending")
            .reduce((sum, p) => sum + Number(p.supplier_amount || 0), 0);
          const completed = payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + Number(p.supplier_amount || 0), 0);
          
          setBalance({
            available: completed,
            pending,
            total: completed + pending
          });
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSavePaymentInfo = () => {
    if (!paymentInfo.bankName || !paymentInfo.accountName || !paymentInfo.rib) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    toast.success("Informations bancaires enregistrées");
  };

  const requestPayout = () => {
    if (balance.available < 50) {
      toast.error("Minimum de retrait: 50 TND");
      return;
    }
    toast.success("Demande de virement envoyée");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700"
  };

  const statusLabels: Record<string, string> = {
    pending: "En cours",
    completed: "Effectué",
    failed: "Échoué"
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Paiements</h1>
        <p className="text-muted-foreground">Gérez vos revenus et demandes de virement.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-bold">Disponible</span>
              </div>
              <p className="text-4xl font-black">{balance.available.toFixed(2)} TND</p>
              <p className="text-sm opacity-80 mt-1">Prêt pour retrait</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">En attente</span>
              </div>
              <p className="text-4xl font-black">{balance.pending.toFixed(2)} TND</p>
              <p className="text-sm text-muted-foreground mt-1">Commandes en cours</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Total</span>
              </div>
              <p className="text-4xl font-black">{balance.total.toFixed(2)} TND</p>
              <p className="text-sm text-muted-foreground mt-1">Revenus totaux</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-primary" />
                Historique des virements
              </CardTitle>
              <CardDescription>Vos dernières demandes de paiement.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payouts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun virement effectué</p>
                  </div>
                ) : (
                  payouts.map((payout, index) => (
                    <motion.div
                      key={payout.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{payout.reference}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payout.createdAt), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${statusColors[payout.status]}`}>
                          {statusLabels[payout.status]}
                        </span>
                        <p className="font-black text-lg">{payout.amount} TND</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-primary" />
                Informations bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Nom de la banque</Label>
                <Input 
                  placeholder="Ex: BIAT, STB, BNA..."
                  value={paymentInfo.bankName}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, bankName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Titulaire du compte</Label>
                <Input 
                  placeholder="Nom complet"
                  value={paymentInfo.accountName}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, accountName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">RIB (20 chiffres)</Label>
                <Input 
                  placeholder="00 000 0000000000000000"
                  value={paymentInfo.rib}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, rib: e.target.value })}
                />
              </div>
              <Button className="w-full" variant="outline" onClick={handleSavePaymentInfo}>
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-bold mb-2">Solde disponible</p>
                <p className="text-3xl font-black text-primary mb-4">{balance.available.toFixed(2)} TND</p>
                <Button 
                  className="w-full bg-primary" 
                  onClick={requestPayout}
                  disabled={balance.available < 50}
                >
                  Demander un virement
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Minimum: 50 TND</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
