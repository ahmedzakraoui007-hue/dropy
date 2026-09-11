import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from '../fixtures/test-data';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function cleanup() {
    console.log('🧹 Nettoyage des données de test...\n');

    try {
        // Supprimer dans l'ordre inverse des dépendances

        // 1. Commandes de test
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('order_timeline').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('store_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Fixed table name from 'orders' to 'store_orders'

        // 2. Produits vendeur
        await supabase.from('seller_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 3. Configuration boutique
        await supabase.from('store_menus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('store_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('store_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 4. Produits fournisseur
        await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 5. Profils (ATTENTION: ne pas supprimer en prod!)
        // Commenter si vous voulez garder les utilisateurs
        // await supabase.from('seller_profiles').delete().eq('store_slug', 'test-boutique');
        // await supabase.from('supplier_profiles').delete().eq('company_name', 'Test Supplier Co');

        console.log('✅ Nettoyage terminé');
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error);
    }
}

// Exécuter si appelé directement
// if (require.main === module) {
//   cleanup();
// }
// ES Modules wrapper
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanup();
}
