import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useOrderActions(sellerId: string) {
  const supabase = createClient();

  const confirmOrder = async (orderId: string, note?: string) => {
    const { error } = await supabase.rpc('transition_order', {
      p_order_id: orderId,
      p_new_status: 'confirmed',
      p_actor_id: sellerId,
      p_actor_type: 'seller',
      p_note: note || 'Client contacté et confirmé'
    });

    if (error) {
      toast.error('Erreur lors de la confirmation');
      return false;
    }
    toast.success('Commande confirmée !');
    return true;
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return false;
    }

    const { error } = await supabase.rpc('transition_order', {
      p_order_id: orderId,
      p_new_status: 'cancelled',
      p_actor_id: sellerId,
      p_actor_type: 'seller',
      p_note: reason
    });

    if (error) {
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
    toast.success('Commande annulée');
    return true;
  };

  const sendToSupplier = async (orderId: string) => {
    const { error } = await supabase.rpc('transition_order', {
      p_order_id: orderId,
      p_new_status: 'processing',
      p_actor_id: sellerId,
      p_actor_type: 'seller',
      p_note: 'Transmise au fournisseur'
    });

    if (error) {
      toast.error('Erreur lors de la transmission');
      return false;
    }
    toast.success('Commande transmise au fournisseur');
    return true;
  };

  const returnOrder = async (orderId: string, reason: string) => {
    const { error } = await supabase.rpc('transition_order', {
      p_order_id: orderId,
      p_new_status: 'returned',
      p_actor_id: sellerId,
      p_actor_type: 'seller',
      p_note: reason
    });

    if (error) {
      toast.error('Erreur lors du marquage en retour');
      return false;
    }
    toast.success('Commande marquée comme retournée');
    return true;
  };

  return { confirmOrder, cancelOrder, sendToSupplier, returnOrder };
}
