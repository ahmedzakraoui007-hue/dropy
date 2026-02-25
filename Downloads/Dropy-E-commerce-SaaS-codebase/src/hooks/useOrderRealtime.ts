import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Order, OrderStatus } from '@/types/orders';

export function useOrderRealtime(
  sellerId: string,
  onNewOrder: (order: Order) => void,
  onOrderUpdate: (order: Order) => void
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // Précharger le son de notification
    audioRef.current = new Audio('/sounds/new-order.mp3');
    audioRef.current.volume = 0.5;

    const channel = supabase
      .channel(`seller-orders-${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'store_orders',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          const newOrder = payload.new as Order;

          audioRef.current?.play().catch(() => { });

          toast.success(
            `🛒 Nouvelle commande #${newOrder.order_number}`,
            {
              description: `${newOrder.customer_name} - ${newOrder.total} TND`,
              duration: 10000,
              action: {
                label: 'Appeler',
                onClick: () => window.open(`tel:${newOrder.customer_phone}`)
              }
            }
          );

          onNewOrder(newOrder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_orders',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          const updated = payload.new as Order;
          const old = payload.old as Order;

          if (updated.status !== old.status) {
            toast.info(
              `Commande #${updated.order_number} → ${getStatusLabel(updated.status)}`,
              { duration: 5000 }
            );
          }

          onOrderUpdate(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, onNewOrder, onOrderUpdate]);
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    processing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    returned: 'Retournée'
  };
  return labels[status];
}
