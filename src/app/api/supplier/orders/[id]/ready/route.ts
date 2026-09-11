import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeliveryShipment, generateShipmentNumber, generatePackageCode } from '@/lib/delivery';

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
      .select(`
        *,
        items:supplier_order_items(*),
        order:orders(
          id,
          order_number,
          customer_name,
          customer_phone,
          shipping_address,
          shipping_city,
          shipping_governorate,
          shipping_postal_code,
          shipping_notes,
          total_amount,
          payment_method
        )
      `)
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
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();
    
    const pickupAddress = supplierProfile?.pickup_address || {
      street: supplierProfile?.address || 'Adresse non configurée',
      city: supplierProfile?.city || 'Ville non configurée',
      country: 'TN',
    };
    
    const mainOrder = supplierOrder.order;
    const deliveryAddress = {
      street: mainOrder?.shipping_address || '',
      city: mainOrder?.shipping_city || '',
      governorate: mainOrder?.shipping_governorate || '',
      postal_code: mainOrder?.shipping_postal_code || '',
      country: 'TN',
      notes: mainOrder?.shipping_notes || '',
    };
    
    const shipmentResult = await createDeliveryShipment({
      pickup: {
        company_name: supplierProfile?.company_name || 'Fournisseur',
        contact_name: supplierProfile?.contact_name || profile?.full_name || 'Contact',
        phone: supplierProfile?.phone || profile?.phone || '',
        address: pickupAddress,
        notes: supplierProfile?.pickup_notes,
      },
      delivery: {
        contact_name: mainOrder?.customer_name || 'Client',
        phone: mainOrder?.customer_phone || '',
        address: deliveryAddress,
        notes: mainOrder?.shipping_notes,
      },
      items: supplierOrder.items.map((item: any) => ({
        description: item.product_name,
        quantity: item.quantity,
        weight: 0.5,
      })),
      cod_amount: mainOrder?.payment_method === 'cod' ? Number(mainOrder.total_amount) : 0,
      reference: supplierOrder.supplier_order_number,
    }, 'dropy_internal');
    
    const shipmentNumber = generateShipmentNumber();
    const packageCode = generatePackageCode(id);
    
    const { error: shipmentError } = await supabase
      .from('delivery_shipments')
      .insert({
        shipment_number: shipmentNumber,
        order_id: supplierOrder.order_id,
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
        cod_amount: mainOrder?.payment_method === 'cod' ? Number(mainOrder.total_amount) : 0,
      });
    
    if (shipmentError) {
      console.error('Error creating shipment:', shipmentError);
    }
    
    await supabase
      .from('shipment_tracking_events')
      .insert({
        shipment_id: (await supabase.from('delivery_shipments').select('id').eq('shipment_number', shipmentNumber).single()).data?.id,
        event_type: 'ready_for_pickup',
        event_description: 'Colis prêt à être enlevé',
        event_timestamp: new Date().toISOString(),
      });
    
    const { error: updateError } = await supabase
      .from('supplier_orders')
      .update({
        status: 'ready_for_pickup',
        ready_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
    
    await supabase
      .from('supplier_order_items')
      .update({ status: 'ready' })
      .eq('supplier_order_id', id);
    
    if (supplierOrder.order_id) {
      await supabase
        .from('orders')
        .update({ 
          status: 'ready_for_pickup',
          tracking_number: shipmentResult.tracking_id,
          delivery_company: 'dropy_internal',
          estimated_delivery: shipmentResult.estimated_delivery.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierOrder.order_id);
    }
    
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
