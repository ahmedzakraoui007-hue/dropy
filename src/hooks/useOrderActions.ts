import { toast } from 'sonner';

async function callOrderApi(orderId: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/seller/orders/${orderId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Erreur');
}

export function useOrderActions(_sellerId: string) {
  const confirmOrder = async (orderId: string) => {
    try {
      await callOrderApi(orderId, { action: 'confirm' });
      toast.success('Commande confirmée : le fournisseur la reçoit maintenant');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la confirmation');
      return false;
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return false;
    }
    try {
      await callOrderApi(orderId, { action: 'cancel', reason: reason.trim() });
      toast.success('Commande annulée, stock remis en vente');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'annulation");
      return false;
    }
  };

  return { confirmOrder, cancelOrder };
}
