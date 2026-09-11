"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Truck, 
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  X,
  AlertCircle,
  Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface SupplierOrder {
  id: string;
  supplier_order_number: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  items: {
    id: string;
    product_name: string;
    product_sku?: string;
    product_image?: string;
    variant_info?: { size?: string; color?: string };
    quantity: number;
    status: string;
  }[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  ready_for_pickup: "bg-purple-100 text-purple-700",
  picked_up: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  preparing: "En préparation",
  ready_for_pickup: "Prêt à enlever",
  picked_up: "Enlevé",
  completed: "Terminée",
  rejected: "Refusée",
  cancelled: "Annulée",
};

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBordereauModal, setShowBordereauModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("supplier_orders")
      .select(`
        *,
        items:supplier_order_items(*)
      `)
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (data) setOrders(data);
    setLoading(false);
  }

  const handleAction = async (orderId: string, action: 'accept' | 'prepare' | 'ready') => {
    setProcessingAction(orderId);
    try {
      const response = await fetch(`/api/supplier/orders/${orderId}/${action}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        loadOrders();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Erreur lors de l'action");
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.supplier_order_number.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const generateBordereau = () => {
    if (selectedOrders.length === 0) {
      toast.error("Sélectionnez au moins une commande");
      return;
    }
    
    const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id));
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bordereau de préparation - DROPY</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .warning-title { color: #92400E; font-weight: bold; margin-bottom: 5px; }
          .warning-text { color: #78350F; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .order-header { background: #EFF6FF; font-weight: bold; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>BON DE PRÉPARATION</h1>
        <p class="subtitle">DROPY - ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        
        <div class="warning">
          <div class="warning-title">⚠️ IMPORTANT - CONFIDENTIALITÉ</div>
          <div class="warning-text">
            Les informations client (nom, adresse, téléphone) ne sont PAS visibles.<br/>
            Dropy gère directement la livraison avec la société de transport.
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Produit</th>
              <th>Variante</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            ${selectedOrdersData.map(order => `
              <tr class="order-header">
                <td colspan="4">${order.supplier_order_number} - ${format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}</td>
              </tr>
              ${order.items.map(item => `
                <tr>
                  <td></td>
                  <td>${item.product_name}</td>
                  <td>${item.variant_info?.size || '-'} / ${item.variant_info?.color || '-'}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('')}
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          Total articles: ${selectedOrdersData.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
    
    setShowBordereauModal(false);
    setSelectedOrders([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Commandes à préparer</h1>
          <p className="text-muted-foreground">Gérez vos commandes de dropshipping.</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setShowBordereauModal(true)}
        >
          <FileText className="w-4 h-4" />
          Imprimer bordereau
        </Button>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Information importante</p>
              <p className="text-xs text-amber-700 mt-1">
                Pour des raisons de confidentialité, les informations client (nom, adresse, téléphone) ne sont pas visibles.
                Dropy coordonne directement avec la société de livraison pour l&apos;enlèvement et la livraison.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showBordereauModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Imprimer un bordereau</h2>
                <p className="text-sm text-muted-foreground">Sélectionnez les commandes à inclure</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowBordereauModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
              {orders.filter(o => ['preparing', 'accepted', 'ready_for_pickup'].includes(o.status)).map(order => (
                <div 
                  key={order.id}
                  className={`p-4 rounded-xl border ${selectedOrders.includes(order.id) ? 'border-primary bg-primary/5' : 'border-border'} cursor-pointer transition-all`}
                  onClick={() => toggleOrderSelection(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{order.supplier_order_number}</span>
                        <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.items.length} produit(s) - {order.items.reduce((s, i) => s + i.quantity, 0)} article(s)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowBordereauModal(false)}>Annuler</Button>
              <Button className="gap-2 bg-primary" onClick={generateBordereau} disabled={selectedOrders.length === 0}>
                <Printer className="w-4 h-4" />
                Imprimer ({selectedOrders.length})
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par numéro..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">Aucune commande</p>
                <p className="text-muted-foreground">Vous n&apos;avez pas encore de commandes à préparer.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl border border-border hover:border-primary/20 transition-all bg-white"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg text-primary">{order.supplier_order_number}</span>
                        <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Créée le {format(new Date(order.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {order.status === "pending" && (
                        <>
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction(order.id, 'accept')}
                            disabled={processingAction === order.id}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Accepter
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                            <XCircle className="w-4 h-4 mr-1" />
                            Refuser
                          </Button>
                        </>
                      )}
                      {order.status === "accepted" && (
                        <Button 
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleAction(order.id, 'prepare')}
                          disabled={processingAction === order.id}
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Commencer préparation
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button 
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleAction(order.id, 'ready')}
                          disabled={processingAction === order.id}
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Prêt à enlever
                        </Button>
                      )}
                      {order.status === "ready_for_pickup" && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">En attente d&apos;enlèvement</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-bold text-sm mb-3">Produits à préparer :</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                          {item.product_image && (
                            <img src={item.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <div className="flex gap-2 mt-1">
                              {item.variant_info?.size && (
                                <Badge variant="outline" className="text-xs">Taille: {item.variant_info.size}</Badge>
                              )}
                              {item.variant_info?.color && (
                                <Badge variant="outline" className="text-xs">Couleur: {item.variant_info.color}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold">{item.quantity}</span>
                            <p className="text-xs text-muted-foreground">unité(s)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>Note :</strong> Les informations du client sont gérées par Dropy. 
                      Une fois le colis prêt, la société de livraison viendra l&apos;enlever directement.
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
