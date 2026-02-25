import { createClient } from '@supabase/supabase-js';
import { seedUsers } from './users.seed';
import { seedSupplier } from './supplier.seed';
import { seedSeller } from './seller.seed';
import { seedGovernorates } from './governorates.seed';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Client Supabase avec Service Role (bypass RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Important: Service Role pour bypass RLS
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
    console.log('🌱 Démarrage du seed...\n');

    try {
        // 1. Gouvernorats (données statiques)
        // console.log('📍 Seed gouvernorats...');
        // await seedGovernorates(supabase);
        // console.log('✅ Gouvernorats OK\n');

        // 2. Utilisateurs de test
        console.log('👥 Seed utilisateurs...');
        const users = await seedUsers(supabase);
        console.log('✅ Utilisateurs OK\n');

        // 3. Fournisseur + Produits
        console.log('📦 Seed fournisseur et produits...');
        const products = await seedSupplier(supabase, users.supplier.id);
        console.log('✅ Fournisseur OK\n');

        // 4. Vendeur + Boutique    // 4. Seed Seller & Store
        console.log('🏪 Seed vendeur et boutique...');
        const availableProducts = await seedSupplier(supabase, users.supplier.id); // Uses Auth ID for products
        await seedSeller(supabase, users.seller.id, users.seller.profileId, availableProducts); // Pass both IDs
        console.log('✅ Vendeur OK\n');

        console.log('🎉 Seed terminé avec succès !');
        console.log('\n📋 Récapitulatif:');
        console.log(`   - Seller: ${users.seller.email}`);
        console.log(`   - Supplier: ${users.supplier.email}`);
        console.log(`   - Boutique: /test-boutique`);
        console.log(`   - Produits: ${products.length} créés`);

    } catch (error) {
        console.error('❌ Erreur seed:', error);
        process.exit(1);
    }
}

seed();
