import { useState } from 'react';
import { Order } from '@/types/orders';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOrderActions } from '@/hooks/useOrderActions';

interface CancelOrderModalProps {
  order: Order | null;
  sellerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  "Client injoignable",
  "Annulation par le client",
  "Produit en rupture de stock",
  "Erreur dans la commande",
  "Zone de livraison non couverte",
  "Autre"
];

export function CancelOrderModal({ order, sellerId, isOpen, onClose, onSuccess }: CancelOrderModalProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const actions = useOrderActions(sellerId);

  const handleCancel = async () => {
    if (!order) return;
    const finalReason = reason === "Autre" ? customReason : reason;
    
    setLoading(true);
    if (await actions.cancelOrder(order.id, finalReason)) {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler la commande #{order?.order_number}</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Veuillez indiquer le motif de l'annulation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motif de l'annulation</Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un motif" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "Autre" && (
            <div className="space-y-2">
              <Label>Précisez le motif</Label>
              <Textarea 
                placeholder="Indiquez la raison..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel} 
            disabled={!reason || (reason === "Autre" && !customReason) || loading}
          >
            {loading ? "Annulation..." : "Confirmer l'annulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
