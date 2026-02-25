"use client";

import { useState, useCallback, useEffect } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useOrderActions } from '@/hooks/useOrderActions';
import { OrderCard } from '@/components/seller/orders/OrderCard';
import { OrderDetailsModal } from '@/components/seller/orders/OrderDetailsModal';
import { CancelOrderModal } from '@/components/seller/orders/CancelOrderModal';
import { RealtimeOrdersListener } from '@/components/seller/orders/RealtimeOrdersListener';
import { Order, OrderStatus, OrderFilters } from '@/types/orders';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw, Filter, PackageX } from 'lucide-react';
import { getStatusLabel } from '@/hooks/useOrderRealtime';
import { Skeleton } from '@/components/ui/skeleton';

const GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba",
  "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
  "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
];

const ORDER_TABS: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'processing', label: 'En préparation' },
  { id: 'shipped', label: 'Expédiées' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
  { id: 'returned', label: 'Retournées' },
];
import { createClient } from '@/lib/supabase/client';

export default function SellerOrdersPage() {
  const [sellerId, setSellerId] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setSellerId(user.id);
    };
    getUser();
  }, []);

  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    search: '',
    dateFrom: null,
    dateTo: null,
    governorate: null
  });

  const { orders, loading, counts, refetch } = useOrders(sellerId, filters);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleCancelOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsCancelOpen(true);
  };

  const handleTabChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value as OrderStatus | 'all' }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleGovernorateChange = (value: string) => {
    setFilters(prev => ({ ...prev, governorate: value === 'all' ? null : value }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <RealtimeOrdersListener
        sellerId={sellerId}
        onNewOrder={() => refetch()}
        onOrderUpdate={() => refetch()}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Commandes</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos ventes, confirmez les commandes et suivez les expéditions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par #CMD, nom ou téléphone..."
                className="pl-10"
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <Select onValueChange={handleGovernorateChange} value={filters.governorate || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="Gouvernorat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les gouvernorats</SelectItem>
                {GOVERNORATES.map(gov => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={filters.status} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
            {ORDER_TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="px-4 py-2 text-xs md:text-sm">
                {tab.label}
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {counts[tab.id]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
          <PackageX className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucune commande trouvée</h3>
          <p className="text-muted-foreground text-sm max-w-xs text-center">
            Il n'y a pas de commandes correspondant à vos critères de recherche ou pour ce statut.
          </p>
          <Button
            variant="link"
            onClick={() => setFilters({ status: 'all', search: '', dateFrom: null, dateTo: null, governorate: null })}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              sellerId={sellerId}
              onViewDetails={handleViewDetails}
              onCancel={handleCancelOrder}
              onRefresh={refetch}
            />
          ))}
        </div>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <CancelOrderModal
        order={selectedOrder}
        sellerId={sellerId}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
