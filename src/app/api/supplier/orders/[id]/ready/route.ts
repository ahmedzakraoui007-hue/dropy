import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createDeliveryShipment, generateShipmentNumber, generatePackageCode } from '@/lib/delivery';
import { linkedStoreOrders, syncStoreOrdersFromSupplier } from '@/lib/order-sync';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: supplierOrder, error: fetchError } = await supabase
      .from('supplier_orders')
      .select('*, items:supplier_order_items(*)')
      .eq('id', id)
      .eq('supplier_id', user.id)
      .single();

    if (fetchError || !supplierOrder) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (supplierOrder.status !== 'preparing') {
      return NextResponse.json({ error: 'La commande doit être en préparation' }, { status: 400 });
    }

    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('company_name, contact_name, pickup_address, pickup_notes')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    const storeOrders = await linkedStoreOrders(id);
    const mainOrder = storeOrders[0];
    const destination = (supplierOrder.delivery_address || {}) as Record<string, string | null>;

    const pickupAddress = supplierProfile?.pickup_address || {
      street: 'Adresse non configurée',
      city: '',
      country: 'TN',
    };

    const deliveryAddress = {
      street: destination.address || mainOrder?.customer_address || '',
      city: destination.city || '',
      governorate: mainOrder?.customer_governorate || '',
      postal_code: '',
      country: 'TN',
      notes: '',
    };

    const codAmount =
      mainOrder && mainOrder.payment_method === 'cod' && !mainOrder.has_own_products && storeOrders.length === 1
        ? Number(mainOrder.total_amount)
        : 0;

    const shipmentResult = await createDeliveryShipment({
      pickup: {
        company_name: supplierProfile?.company_name || 'Fournisseur',
        contact_name: supplierProfile?.contact_name || profile?.full_name || 'Contact',
        phone: profile?.phone || '',
        address: pickupAddress,
        notes: supplierProfile?.pickup_notes,
      },
      delivery: {
        contact_name: destination.name || mainOrder?.customer_name || 'Client',
        phone: destination.phone || mainOrder?.customer_phone || '',
        address: deliveryAddress,
      },
      items: (supplierOrder.items || []).map((item: any) => ({
        description: item.product_name,
        quantity: item.quantity,
        weight: 0.5,
      })),
      cod_amount: codAmount,
      reference: supplierOrder.supplier_order_number,
    }, 'dropy_internal');

    const admin = createAdminClient();
    const shipmentNumber = generateShipmentNumber();
    const packageCode = generatePackageCode(id);

    const { data: shipment, error: shipmentError } = await admin
      .from('delivery_shipments')
      .insert({
        shipment_number: shipmentNumber,
        supplier_order_id: id,
        delivery_company: 'dropy_internal',
        external_tracking_id: shipmentResult.tracking_id,
        tracking_url: shipmentResult.tracking_url,
        pickup_address: pickupAddress,
        pickup_status: 'scheduled',
        pickup_scheduled_at: shipmentResult.pickup_date.toISOString(),
        delivery_address: deliveryAddress,
        delivery_status: 'pending',
        shipping_cost: shipmentResult.cost,
        cod_amount: codAmount,
      })
      .select('id')
      .single();

    if (shipmentError) {
      console.error('Error creating shipment:', shipmentError);
    } else {
      await admin.from('shipment_tracking_events').insert({
        shipment_id: shipment.id,
        event_type: 'ready_for_pickup',
        event_description: 'Colis prêt à être enlevé',
        event_timestamp: new Date().toISOString(),
      });
    }

    const { error: updateError } = await supabase
      .from('supplier_orders')
      .update({
        status: 'ready_for_pickup',
        ready_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tracking_number: shipmentResult.tracking_id,
        shipping_company: 'dropy_internal',
        estimated_delivery: shipmentResult.estimated_delivery.toISOString().slice(0, 10),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    await supabase
      .from('supplier_order_items')
      .update({ status: 'ready' })
      .eq('supplier_order_id', id);

    await syncStoreOrdersFromSupplier(id, 'ready_for_pickup', {
      tracking_number: shipmentResult.tracking_id,
      shipping_company: 'dropy_internal',
      estimated_delivery: shipmentResult.estimated_delivery.toISOString().slice(0, 10),
    });

    return NextResponse.json({
      success: true,
      message: 'Commande prête pour enlèvement',
      status: 'ready_for_pickup',
      tracking_number: shipmentResult.tracking_id,
      pickup_date: shipmentResult.pickup_date,
      estimated_delivery: shipmentResult.estimated_delivery,
      package_code: packageCode,
    });
  } catch (error) {
    console.error('Error marking order ready:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
