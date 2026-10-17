import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyShipmentStatus } from '@/lib/shipments';
import { createHmac, timingSafeEqual } from 'node:crypto';

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.DELIVERY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const given = signature.replace(/^sha256=/, '');
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const STATUS_MAP: Record<string, string> = {
  PICKUP_SCHEDULED: 'pickup_scheduled',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  DELIVERY_FAILED: 'failed',
  RETURNED: 'returned',
};

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
      .select('id')
      .eq('external_tracking_id', payload.tracking_id)
      .maybeSingle();

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    await applyShipmentStatus(shipment.id, {
      status: STATUS_MAP[payload.status] || payload.status,
      description: payload.description,
      location: payload.location,
      timestamp: payload.timestamp,
      receiver_name: payload.receiver_name,
      signature_url: payload.signature_url,
      photo_url: payload.photo_url,
      cod_collected: payload.cod_collected,
      failure_reason: payload.failure_reason,
      raw: payload,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
