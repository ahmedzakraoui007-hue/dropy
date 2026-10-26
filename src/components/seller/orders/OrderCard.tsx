import { Order, OrderStatus } from '@/types/orders';
import { sellerConfirmationMessage, whatsappLink, type MessageOrder } from '@/lib/order-messages';
import { useOrderActions } from '@/hooks/useOrderActions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, CheckCircle, Truck, XCircle, Eye, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { useTranslation } from '@/context/LanguageContext';
import { formatPrice } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  sellerId: string;
  onViewDetails: (order: Order) => void;
  onCancel: (order: Order) => void;
  onRefresh: () => void;
}

export function OrderCard({ order, sellerId, onViewDetails, onCancel, onRefresh }: OrderCardProps) {
  const actions = useOrderActions(sellerId);
  const { t, locale } = useTranslation();

  const handleConfirm = async () => {
    if (await actions.confirmOrder(order.id)) {
      onRefresh();
    }
  };


  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-sm font-bold">#{order.order_number}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: locale === 'ar' ? ar : fr })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={getStatusColor(order.status)} variant="outline">
            {t(`seller_app.status.${order.status}`)}
          </Badge>
          {(order.risk_flags?.length ?? 0) > 0 && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800" title={(order.risk_flags || []).map((f) => t(`seller_app.protection.flags.${f}`)).join(" · ")}>
              ⚠ {t("seller_app.protection.suspicious")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{formatPrice(order.total_amount || 0)}</p>
              <p className="text-[10px] text-muted-foreground">{order.payment_method === 'cod' ? t('seller_app.orders.card.cod') : order.payment_method}</p>
            </div>
          </div>
          
          <div className="flex items-start text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{[order.customer_address, order.customer_governorate].filter(Boolean).join(', ')}</span>
          </div>
          {order.notes && (
            <p className="line-clamp-2 whitespace-pre-line rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800" dir="auto">{order.notes}</p>
          )}

          <div className="text-xs border-t pt-2 mt-2">
            <span className="font-medium">{t('seller_app.orders.card.products')}</span> {order.items?.map(item => `${item.quantity}x ${item.product_name}`).join(', ')}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onViewDetails(order)}>
          <Eye className="w-3 h-3 me-1" /> {t('seller_app.orders.card.details')}
        </Button>
        
        {order.status === 'new' && (
          <>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => window.open(`tel:${order.customer_phone}`)}>
              <Phone className="w-3 h-3 me-1" /> {t('seller_app.orders.card.call')}
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50" onClick={() => window.open(whatsappLink(order.customer_phone, sellerConfirmationMessage(order as MessageOrder, (order as any).store?.name || '', (order as any).store?.storefront_language === 'ar' ? 'ar' : 'fr')), '_blank', 'noopener,noreferrer')}>
              <MessageCircle className="w-3 h-3 me-1" /> WhatsApp
            </Button>
            <Button variant="default" size="sm" className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>
              <CheckCircle className="w-3 h-3 me-1" /> {t('seller_app.orders.card.confirm')}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto" onClick={() => onCancel(order)}>
              <XCircle className="w-3 h-3 me-1" /> {t('seller_app.orders.card.cancel')}
            </Button>
          </>
        )}

        {order.status === 'confirmed' && (
          <>
            <span className="inline-flex items-center text-xs font-medium text-indigo-700">
              <Truck className="w-3 h-3 me-1" /> {t('seller_app.orders.card.sent')}
            </span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto" onClick={() => onCancel(order)}>
              <XCircle className="w-3 h-3 me-1" /> {t('seller_app.orders.card.cancel')}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
