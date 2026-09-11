import { Order } from '@/types/orders';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { OrderTimeline } from './OrderTimeline';
import { Badge } from '@/components/ui/badge';
import { getStatusLabel } from '@/hooks/useOrderRealtime';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, User, Package, CreditCard } from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Commande #{order.order_number}</DialogTitle>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <DialogDescription>
            Détails complets de la commande et historique des actions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold flex items-center mb-3">
                <User className="w-4 h-4 mr-2" /> Informations Client
              </h3>
              <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium">{order.customer_name}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mr-2" /> {order.customer_phone}
                </div>
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mr-2 mt-0.5 shrink-0" />
                  <span>{order.customer_address}, {order.customer_city}, {order.customer_governorate}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold flex items-center mb-3">
                <Package className="w-4 h-4 mr-2" /> Articles
              </h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && <p className="text-xs text-muted-foreground">{item.variant_name}</p>}
                      <p className="text-xs text-muted-foreground">{item.quantity} x {item.unit_price} TND</p>
                    </div>
                    <span className="font-medium">{item.total_price} TND</span>
                  </div>
                ))}
                <Separator />
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sous-total</span>
                    <span>{order.subtotal} TND</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Livraison</span>
                    <span>{order.shipping_cost} TND</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>Total</span>
                    <span>{order.total} TND</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold flex items-center mb-3">
                <CreditCard className="w-4 h-4 mr-2" /> Profit Vendeur
              </h3>
              <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg">
                <div className="flex justify-between items-center font-bold text-primary">
                  <span>Marge nette</span>
                  <span>{order.seller_profit} TND</span>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold mb-4">Historique de la commande</h3>
              <OrderTimeline timeline={order.timeline || []} />
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
