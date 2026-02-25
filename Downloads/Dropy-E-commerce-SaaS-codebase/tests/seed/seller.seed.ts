import { SupabaseClient } from '@supabase/supabase-js';
import { TEST_USERS } from '../fixtures/test-data';

export async function seedSeller(
    supabase: SupabaseClient,
    sellerAuthId: string,
    sellerProfileId: string,
    availableProducts: any[]
) {
    // 0. Créer l'entrée dans la table 'stores' (Table principale pour le storefront)
    // Uses Auth ID (vendor_id)
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .upsert({
            vendor_id: sellerAuthId,
            name: TEST_USERS.seller.storeName,
            slug: TEST_USERS.seller.storeSlug,
            status: 'published',
            is_active: true,
            theme: 'modern', // Default
            primary_color: '#6366f1',
            secondary_color: '#f8fafc',
        }, { onConflict: 'slug' })
        .select()
        .single();

    if (storeError) {
        console.error('❌ Error creating store:', storeError);
        // If error, we might fallback or throw. Let's throw to be safe.
        // throw storeError; // Skipping throw to verify if it's a view
    }
    const storeId = store?.id; // Use this for pages

    // 1. Créer/Mettre à jour la configuration de la boutique
    // Uses Profile ID (seller_id)
    const { data: storeConfig } = await supabase
        .from('store_configs')
        .upsert({
            seller_id: sellerProfileId,
            theme_id: null, // Sera défini si des thèmes existent
            store_name: TEST_USERS.seller.storeName,
            store_slug: TEST_USERS.seller.storeSlug,
            store_tagline: 'La mode urbaine à prix doux',
            logo_url: 'https://ui-avatars.com/api/?name=Test+Boutique&background=6366f1&color=fff&size=200',
            favicon_url: null,
            colors: {
                primary: '#6366f1',
                secondary: '#f8fafc',
                accent: '#ec4899',
                background: '#ffffff',
                text: '#1e293b',
            },
            typography: {
                heading_font: 'Plus Jakarta Sans',
                body_font: 'Inter',
                base_size: 16,
            },
            header_config: {
                style: 'standard',
                sticky: true,
                show_search: true,
                show_cart: true,
                show_announcement: true,
                announcement_text: '🚚 Livraison gratuite dès 100 TND !',
                announcement_bg: '#6366f1',
                announcement_text_color: '#ffffff',
            },
            footer_config: {
                style: 'multi_column',
                show_newsletter: true,
                newsletter_title: 'Restez informé',
                show_social: true,
                show_payment_icons: true,
            },
            social_links: {
                instagram: 'https://instagram.com/testboutique',
                facebook: 'https://facebook.com/testboutique',
            },
            contact_info: {
                email: 'contact@testboutique.tn',
                phone: '+216 12 345 678',
                whatsapp: '+21612345678',
            },
            is_published: true,
            published_at: new Date().toISOString(),
        }, { onConflict: 'seller_id' })
        .select()
        .single();

    // 2. Créer la page d'accueil
    console.log('Using Store ID for pages:', storeId);

    // Clean up existing pages to ensure fresh data (and correct store_id)
    await supabase.from('store_pages').delete().eq('seller_id', sellerProfileId);

    const homepageSections = [
        {
            id: 'hero-1',
            type: 'hero',
            is_visible: true,
            position: 0,
            content: {
                style: 'fullscreen',
                background_type: 'image',
                background_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920',
                overlay_opacity: 0.4,
                title: 'Nouvelle Collection',
                subtitle: 'Découvrez les dernières tendances de la mode urbaine',
                cta_text: 'Voir la collection',
                cta_link: '/products',
                text_alignment: 'center',
                text_color: 'light',
                height: 'large',
            },
            styles: null
        },
        {
            id: 'products-1',
            type: 'product_grid',
            is_visible: true,
            position: 1,
            content: {
                title: 'Nos Best-sellers',
                subtitle: 'Les produits préférés de nos clients',
                source: 'newest',
                count: 8,
                columns: 4,
                show_view_all: true,
                view_all_link: '/products',
            },
            styles: null
        },
        {
            id: 'benefits-1',
            type: 'benefits',
            is_visible: true,
            position: 2,
            content: {
                display: 'row',
                items: [
                    { icon: 'Truck', title: 'Livraison rapide', description: 'Partout en Tunisie' },
                    { icon: 'Shield', title: 'Paiement sécurisé', description: 'À la livraison' },
                    { icon: 'RotateCcw', title: 'Retours faciles', description: 'Sous 14 jours' },
                    { icon: 'Headphones', title: 'Support 7j/7', description: 'Par WhatsApp' },
                ],
            },
            styles: null
        },
        {
            id: 'categories-1',
            type: 'category_grid',
            is_visible: true,
            position: 3,
            content: {
                title: 'Nos Catégories',
                style: 'card',
                columns: 4,
                categories: [
                    { name: 'Mode Homme', slug: 'mode-homme', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600' },
                    { name: 'Mode Femme', slug: 'mode-femme', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600' },
                    { name: 'Chaussures', slug: 'chaussures', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600' },
                    { name: 'Accessoires', slug: 'accessoires', image: 'https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?w=600' },
                ],
            },
            styles: null
        },
        {
            id: 'newsletter-1',
            type: 'newsletter',
            is_visible: true,
            position: 4,
            content: {
                title: 'Rejoignez notre newsletter',
                subtitle: 'Recevez nos offres exclusives et nouveautés',
                button_text: 'S\'inscrire',
                background_type: 'color',
                background_color: '#f1f5f9',
                success_message: 'Merci pour votre inscription !',
            },
            styles: null
        },
    ];

    const { data: homePage, error: pageError } = await supabase
        .from('store_pages')
        .insert({
            seller_id: sellerProfileId,
            store_id: storeId, // Using real store ID
            slug: 'home',
            title: 'Accueil',
            page_type: 'homepage',
            is_homepage: true,
            is_published: true,
            is_system: true,
            sections: homepageSections,
        })
        .select()
        .single();

    if (pageError) console.error('Error inserting homepage:', pageError);
    console.log('Inserted Homepage:', homePage?.slug, 'Store ID:', homePage?.store_id);

    // No strict need to populate store_sections anymore as per Spec-001
    // Deleting any legacy sections if they exist to be clean
    if (homePage) {
        await supabase.from('store_sections').delete().eq('store_page_id', homePage.id);
    }

    // 3. Créer les pages système
    const systemPages = [
        {
            slug: 'about',
            title: 'À propos',
            page_type: 'content',
            content_html: '<h1>Notre Histoire</h1><p>Test Boutique est née de la passion pour la mode urbaine...</p>',
        },
        {
            slug: 'contact',
            title: 'Contact',
            page_type: 'contact',
        },
        {
            slug: 'faq',
            title: 'FAQ',
            page_type: 'faq',
            faq_items: [
                { question: 'Comment passer commande ?', answer: 'Ajoutez vos articles au panier puis suivez les étapes de checkout.' },
                { question: 'Quels sont les délais de livraison ?', answer: 'Entre 2 et 5 jours selon votre localisation.' },
                { question: 'Puis-je retourner un article ?', answer: 'Oui, sous 14 jours si l\'article est non porté avec étiquettes.' },
                { question: 'Quels modes de paiement acceptez-vous ?', answer: 'Paiement à la livraison (Cash on Delivery).' },
            ],
        },
        {
            slug: 'cgv',
            title: 'Conditions Générales de Vente',
            page_type: 'legal',
            content_html: '<h1>CGV</h1><p>Conditions générales de vente de Test Boutique...</p>',
        },
    ];

    for (const page of systemPages) {
        await supabase
            .from('store_pages')
            .upsert({
                seller_id: sellerProfileId,
                store_id: storeId,
                ...page,
                is_published: true,
                is_system: true,
            }, { onConflict: 'seller_id,slug' });
    }

    // 4. Importer des produits pour ce vendeur
    const productsToImport = availableProducts.slice(0, 5); // Importer les 5 premiers

    for (const product of productsToImport) {
        const sellingPrice = product.suggested_price || product.base_price * 1.4;

        await supabase
            .from('seller_products')
            .upsert({
                seller_id: sellerProfileId,
                product_id: product.id,
                selling_price: sellingPrice,
                compare_at_price: sellingPrice * 1.2, // Prix barré
                is_active: true,
            }, { onConflict: 'seller_id,product_id' });

        // Also seed store_products (if it's a table)
        // Clean up first to avoid duplicates
        await supabase.from('store_products').delete().eq('store_id', storeId).eq('product_id', product.id);

        const { error: storeProdError } = await supabase
            .from('store_products')
            .insert({
                store_id: storeId,
                product_id: product.id,
                selling_price: sellingPrice,
                is_active: true,
            });

        if (storeProdError) {
            console.warn('⚠️ Could not seed store_products:', storeProdError.message);
        }
    }

    // 5. Créer les menus de navigation
    await supabase
        .from('store_menus')
        .upsert([
            {
                seller_id: sellerProfileId,
                location: 'header',
                items: [
                    { id: 'nav-1', label: 'Accueil', type: 'page', value: 'home' },
                    { id: 'nav-2', label: 'Boutique', type: 'page', value: 'products' },
                    { id: 'nav-3', label: 'À propos', type: 'page', value: 'about' },
                    { id: 'nav-4', label: 'Contact', type: 'page', value: 'contact' },
                ],
            },
            {
                seller_id: sellerProfileId,
                location: 'footer',
                items: [
                    { id: 'footer-1', label: 'FAQ', type: 'page', value: 'faq' },
                    { id: 'footer-2', label: 'CGV', type: 'page', value: 'cgv' },
                    { id: 'footer-3', label: 'Contact', type: 'page', value: 'contact' },
                ],
            },
        ], { onConflict: 'seller_id,location' });

    // 6. Configuration livraison
    await supabase
        .from('shipping_configs')
        .upsert({
            seller_id: sellerProfileId,
            free_shipping_threshold: 100,
            default_shipping_cost: 7,
            zones: [
                { governorates: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba'], cost: 7, days: '1-2' },
                { governorates: ['Nabeul', 'Sousse', 'Monastir', 'Bizerte'], cost: 8, days: '2-3' },
                { governorates: ['Sfax', 'Kairouan', 'Mahdia'], cost: 9, days: '3-4' },
            ],
        }, { onConflict: 'seller_id' });

    return storeConfig;
}
