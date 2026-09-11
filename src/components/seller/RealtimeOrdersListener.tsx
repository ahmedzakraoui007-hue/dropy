"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface RealtimeOrdersListenerProps {
  sellerId: string;
  onNewOrder?: () => void;
}

export function RealtimeOrdersListener({ sellerId, onNewOrder }: RealtimeOrdersListenerProps) {
  useEffect(() => {
    if (!sellerId) return;
    const supabase = createClient();

    const channel = supabase
      .channel('new-orders-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'store_orders',
        },
        async (payload) => {
          // Verify if this order belongs to the seller's store
          const { data: store } = await supabase
            .from('stores')
            .select('id')
            .eq('vendor_id', sellerId)
            .single();

          if (store && payload.new.store_id === store.id) {
            // Play a notification sound (if available)
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.play();
            } catch (e) {
              console.log('Audio playback failed', e);
            }
            
            toast.success(`Nouvelle commande ! ${payload.new.total_amount} TND`);
            if (onNewOrder) onNewOrder();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, onNewOrder]);

  return null;
}
