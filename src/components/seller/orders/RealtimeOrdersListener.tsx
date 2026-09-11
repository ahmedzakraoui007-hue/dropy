import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { Order } from '@/types/orders';

interface RealtimeOrdersListenerProps {
  sellerId: string;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
}

export function RealtimeOrdersListener({ sellerId, onNewOrder, onOrderUpdate }: RealtimeOrdersListenerProps) {
  useOrderRealtime(
    sellerId, 
    (order) => onNewOrder?.(order), 
    (order) => onOrderUpdate?.(order)
  );

  return null; // Composant invisible qui gère juste les side-effects
}
