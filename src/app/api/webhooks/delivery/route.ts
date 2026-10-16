import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncStoreOrdersFromSupplier } from '@/lib/order-sync';
import { createHmac, timingSafeEqual } from 'node:crypto';

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.DELIVERY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const given = signature.replace(/^sha256=/, '');
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    if (!validSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    const payload = JSON.parse(rawBody);
    
    const supabase = createAdminClient();
    
    const { data: shipment } = await supabase
      .from('delivery_shipments')
      .select('*')
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
    
    if (shipment.supplier_order_id && (newStatus === 'picked_up' || newStatus === 'delivered')) {
      const now = new Date().toISOString();
      const supplierStatus = newStatus === 'picked_up' ? 'shipped' : 'delivered';
      await supabase
        .from('supplier_orders')
        .update(
          newStatus === 'picked_up'
            ? { status: supplierStatus, picked_up_at: now, shipped_at: now, updated_at: now }
            : { status: supplierStatus, delivered_at: now, updated_at: now }
        )
        .eq('id', shipment.supplier_order_id);
      await syncStoreOrdersFromSupplier(shipment.supplier_order_id, supplierStatus);
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
