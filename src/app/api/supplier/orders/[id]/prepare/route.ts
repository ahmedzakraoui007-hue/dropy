import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .select('*')
      .eq('id', id)
      .eq('supplier_id', user.id)
      .single();
    
    if (fetchError || !supplierOrder) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    if (supplierOrder.status !== 'accepted') {
      return NextResponse.json({ error: 'Veuillez d\'abord accepter la commande' }, { status: 400 });
    }
    
    const { error: updateError } = await supabase
      .from('supplier_orders')
      .update({
        status: 'preparing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
    
    await supabase
      .from('supplier_order_items')
      .update({ status: 'preparing' })
      .eq('supplier_order_id', id);
    
    if (supplierOrder.order_id) {
      await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierOrder.order_id);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Commande en préparation',
      status: 'preparing'
    });
  } catch (error) {
    console.error('Error preparing order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
