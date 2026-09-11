import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-webhook-signature');
    
    const supabase = await createClient();
    
    const { data: shipment } = await supabase
      .from('delivery_shipments')
      .select('*, order:orders(*), supplier_order:supplier_orders(*)')
      .eq('external_tracking_id', payload.tracking_id)
      .single();
    
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }
    
    const statusMap: Record<string, string> = {
      'PICKUP_SCHEDULED': 'pickup_scheduled',
      'PICKED_UP': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'DELIVERY_FAILED': 'failed',
      'RETURNED': 'returned',
    };
    
    const newStatus = statusMap[payload.status] || payload.status;
    
    const updateData: any = {
      delivery_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    
    if (newStatus === 'picked_up') {
      updateData.pickup_status = 'picked_up';
      updateData.pickup_completed_at = new Date().toISOString();
    }
    
    if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
      updateData.receiver_name = payload.receiver_name;
      updateData.delivery_signature = payload.signature_url;
      updateData.delivery_photo = payload.photo_url;
      if (payload.cod_collected) {
        updateData.cod_collected = true;
      }
    }
    
    if (newStatus === 'failed') {
      updateData.delivery_attempts = (shipment.delivery_attempts || 0) + 1;
      updateData.failure_reason = payload.failure_reason;
    }
    
    await supabase
      .from('delivery_shipments')
      .update(updateData)
      .eq('id', shipment.id);
    
    await supabase
      .from('shipment_tracking_events')
      .insert({
        shipment_id: shipment.id,
        event_type: newStatus,
        event_description: payload.description || getStatusDescription(newStatus),
        event_location: payload.location,
        event_timestamp: payload.timestamp || new Date().toISOString(),
        raw_data: payload,
      });
    
    const orderStatusMap: Record<string, string> = {
      'picked_up': 'in_transit',
      'in_transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'returned': 'returned',
    };
    
    if (orderStatusMap[newStatus] && shipment.order_id) {
      const orderUpdate: any = { 
        status: orderStatusMap[newStatus],
        updated_at: new Date().toISOString(),
      };
      
      if (newStatus === 'delivered') {
        orderUpdate.delivered_at = new Date().toISOString();
      }
      if (newStatus === 'in_transit') {
        orderUpdate.shipped_at = orderUpdate.shipped_at || new Date().toISOString();
      }
      
      await supabase
        .from('orders')
        .update(orderUpdate)
        .eq('id', shipment.order_id);
    }
    
    if (newStatus === 'picked_up' && shipment.supplier_order_id) {
      await supabase
        .from('supplier_orders')
        .update({ 
          status: 'picked_up',
          picked_up_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipment.supplier_order_id);
    }
    
    if (newStatus === 'delivered' && shipment.supplier_order_id) {
      await supabase
        .from('supplier_orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipment.supplier_order_id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'pickup_scheduled': 'Enlèvement programmé',
    'picked_up': 'Colis enlevé par le livreur',
    'in_transit': 'Colis en transit',
    'out_for_delivery': 'Colis en cours de livraison',
    'delivered': 'Colis livré avec succès',
    'failed': 'Échec de la livraison',
    'returned': 'Colis retourné',
  };
  return descriptions[status] || status;
}
