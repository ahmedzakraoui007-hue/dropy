import { SupabaseClient } from '@supabase/supabase-js';

const SAMPLE_PRODUCTS = [
    {
        name: 'T-shirt Oversize Premium',
        slug: 't-shirt-oversize-premium',
        description: 'T-shirt oversize en coton bio, coupe moderne et confortable.',
        // category: 'Mode Homme',
        // subcategory: 'T-shirts',
        base_price: 35.000,
        suggested_price: 55.000,
        stock_quantity: 100,
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
        ],
        variants: [
            { name: 'S - Noir', sku: 'TSHIRT-S-BLK', size: 'S', color: 'Noir', stock: 20 },
            { name: 'M - Noir', sku: 'TSHIRT-M-BLK', size: 'M', color: 'Noir', stock: 25 },
            { name: 'L - Noir', sku: 'TSHIRT-L-BLK', size: 'L', color: 'Noir', stock: 25 },
            { name: 'XL - Noir', sku: 'TSHIRT-XL-BLK', size: 'XL', color: 'Noir', stock: 15 },
            { name: 'M - Blanc', sku: 'TSHIRT-M-WHT', size: 'M', color: 'Blanc', stock: 15 },
        ],
    },
    {
        name: 'Jean Slim Fit',
        slug: 'jean-slim-fit',
        description: 'Jean slim en denim stretch, confort et style.',
        // category: 'Mode Homme',
        // subcategory: 'Pantalons',
        base_price: 65.000,
        suggested_price: 95.000,
        stock_quantity: 80,
        images: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
        ],
        variants: [
            { name: '40 - Bleu', sku: 'JEAN-40-BLU', size: '40', color: 'Bleu', stock: 20 },
            { name: '42 - Bleu', sku: 'JEAN-42-BLU', size: '42', color: 'Bleu', stock: 25 },
            { name: '44 - Bleu', sku: 'JEAN-44-BLU', size: '44', color: 'Bleu', stock: 20 },
            { name: '42 - Noir', sku: 'JEAN-42-BLK', size: '42', color: 'Noir', stock: 15 },
        ],
    },
    {
        name: 'Robe Été Fleurie',
        slug: 'robe-ete-fleurie',
        description: 'Robe légère à motifs floraux, parfaite pour l\'été.',
        // category: 'Mode Femme',
        // subcategory: 'Robes',
        base_price: 45.000,
        suggested_price: 75.000,
        stock_quantity: 60,
        images: [
            'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
        ],
        variants: [
            { name: 'S', sku: 'ROBE-S', size: 'S', color: 'Fleuri', stock: 15 },
            { name: 'M', sku: 'ROBE-M', size: 'M', color: 'Fleuri', stock: 20 },
            { name: 'L', sku: 'ROBE-L', size: 'L', color: 'Fleuri', stock: 15 },
        ],
    },
    {
        name: 'Sneakers Urban',
        slug: 'sneakers-urban',
        description: 'Baskets tendance pour un look streetwear.',
        // category: 'Chaussures',
        // subcategory: 'Sneakers',
        base_price: 85.000,
        suggested_price: 129.000,
        stock_quantity: 50,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        ],
        variants: [
            { name: '40', sku: 'SNEAK-40', size: '40', color: 'Blanc', stock: 10 },
            { name: '41', sku: 'SNEAK-41', size: '41', color: 'Blanc', stock: 10 },
            { name: '42', sku: 'SNEAK-42', size: '42', color: 'Blanc', stock: 15 },
            { name: '43', sku: 'SNEAK-43', size: '43', color: 'Blanc', stock: 10 },
        ],
    },
    {
        name: 'Sac à Main Cuir',
        slug: 'sac-main-cuir',
        description: 'Sac à main en cuir véritable, élégant et pratique.',
        // category: 'Accessoires',
        // subcategory: 'Sacs',
        base_price: 120.000,
        suggested_price: 180.000,
        stock_quantity: 30,
        images: [
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        ],
        variants: [
            { name: 'Noir', sku: 'SAC-BLK', size: 'Unique', color: 'Noir', stock: 15 },
            { name: 'Marron', sku: 'SAC-BRN', size: 'Unique', color: 'Marron', stock: 15 },
        ],
    },
];

export async function seedSupplier(supabase: SupabaseClient, supplierId: string) {
    const createdProducts: any[] = [];

    for (const product of SAMPLE_PRODUCTS) {
        // Créer le produit principal
        const { data: createdProduct, error: productError } = await supabase
            .from('products')
            .upsert({
                supplier_id: supplierId,
                name: product.name,
                slug: product.slug,
                description: product.description,
                // category: product.category,
                // subcategory: product.subcategory,
                base_price: product.base_price,
                stock_quantity: product.stock_quantity,
                images: product.images,
                status: 'active',
            }, { onConflict: 'slug' })
            .select()
            .single();

        if (productError) {
            console.error(`Erreur création produit ${product.name}:`, productError);
            continue;
        }

        // Créer les variantes
        if (product.variants && product.variants.length > 0) {
            const variantsToInsert = product.variants.map((v, index) => ({
                product_id: createdProduct.id,
                name: v.name,
                sku: v.sku,
                attributes: { size: v.size, color: v.color },
                stock_quantity: v.stock,
                price_adjustment: 0,
                is_active: true,
                sort_order: index,
            }));

            await supabase
                .from('product_variants')
                .upsert(variantsToInsert, { onConflict: 'sku' });
        }

        createdProducts.push(createdProduct);
    }

    return createdProducts;
}
