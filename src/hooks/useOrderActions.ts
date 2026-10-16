import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useOrderActions(_sellerId: string) {
  const supabase = createClient();

  const update = async (orderId: string, values: Record<string, unknown>, success: string, failure: string) => {
    const { error } = await supabase.from('store_orders').update(values).eq('id', orderId);
    if (error) {
      console.error(failure, error);
      toast.error(failure);
      return false;
    }
    toast.success(success);
    return true;
  };

  const confirmOrder = (orderId: string, note?: string) =>
    update(
      orderId,
      note ? { status: 'confirmed', seller_notes: note } : { status: 'confirmed' },
      'Commande confirmée !',
      'Erreur lors de la confirmation'
    );

  const cancelOrder = async (orderId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return false;
    }
    return update(orderId, { status: 'cancelled', notes: reason.trim() }, 'Commande annulée', "Erreur lors de l'annulation");
  };

  const sendToSupplier = (orderId: string) =>
    update(orderId, { status: 'preparing' }, 'Commande transmise au fournisseur', 'Erreur lors de la transmission');

  const returnOrder = (orderId: string, reason: string) =>
    update(orderId, { notes: `Retour : ${reason}` }, 'Retour enregistré', "Erreur lors de l'enregistrement du retour");

  return { confirmOrder, cancelOrder, sendToSupplier, returnOrder };
}
