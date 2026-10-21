import { useState } from 'react';
import { Order } from '@/types/orders';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOrderActions } from '@/hooks/useOrderActions';
import { useTranslation } from '@/context/LanguageContext';

interface CancelOrderModalProps {
  order: Order | null;
  sellerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = ["unreachable", "customer_cancelled", "out_of_stock", "order_error", "zone", "other"];

export function CancelOrderModal({ order, sellerId, isOpen, onClose, onSuccess }: CancelOrderModalProps) {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.orders.cancel_modal.${key}`);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const actions = useOrderActions(sellerId);

  const handleCancel = async () => {
    if (!order) return;
    const finalReason = reason === "other" ? customReason || "other" : reason;
    
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
          <DialogTitle>{tr("title").replace("{number}", order?.order_number ?? "")}</DialogTitle>
          <DialogDescription>
            {tr("desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{tr("reason")}</Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger>
                <SelectValue placeholder={tr("reason_ph")} />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{tr(`reasons.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "other" && (
            <div className="space-y-2">
              <Label>{tr("custom")}</Label>
              <Textarea 
                placeholder={tr("custom_ph")}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>{tr("back")}</Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel} 
            disabled={!reason || (reason === "other" && !customReason) || loading}
          >
            {loading ? tr("submitting") : tr("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
