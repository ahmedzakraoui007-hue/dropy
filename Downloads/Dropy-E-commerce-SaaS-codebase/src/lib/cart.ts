'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const CART_COOKIE_NAME = 'dropy_cart_id';

export async function getCart(storeId: string) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!cartId) return null;

    const { data: cart } = await supabase
        .from('carts')
        .select(`
      id,
      store_id,
      visitor_id,
      cart_items (
        id,
        product_id,
        quantity,
        options,
        product:products (
          id,
          name,
          price,
          images
        )
      )
    `)
        .eq('id', cartId)
        .eq('store_id', storeId)
        .single();

    return cart;
}

export async function addToCart(storeId: string, productId: string, quantity: number, options: any = {}) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    let cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    // 1. Create Cart if not exists
    if (!cartId) {
        const visitorId = crypto.randomUUID();
        const { data: newCart, error: cartError } = await supabase
            .from('carts')
            .insert({
                store_id: storeId,
                visitor_id: visitorId,
            })
            .select('id')
            .single();

        if (cartError) throw new Error('Failed to create cart');

        cartId = newCart?.id;
        if (!cartId) throw new Error('Failed to create cart');
        cookieStore.set(CART_COOKIE_NAME, cartId, { path: '/' });
    }

    // 2. Check if item exists in cart to update quantity
    const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .single();

    if (existingItem) {
        // Update quantity
        await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);
    } else {
        // Insert new item
        await supabase
            .from('cart_items')
            .insert({
                cart_id: cartId,
                product_id: productId,
                quantity,
                options
            });
    }

    revalidatePath('/shop'); // Revalidate shop pages
    return { success: true, cartId };
}

export async function removeFromCart(itemId: string) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!cartId) return;

    await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('cart_id', cartId); // Security check

    revalidatePath('/shop');
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!cartId) return;

    if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
    }

    await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .eq('cart_id', cartId);

    revalidatePath('/shop');
}

export async function clearCart(storeId: string) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!cartId) return;

    await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

    revalidatePath('/shop');
}
