import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verify() {
    console.log('🔍 Verifying Seed Data...');

    // 1. Check Store
    const { data: stores, error: storeError } = await supabase.from('stores').select('*').eq('slug', 'test-boutique');
    console.log('\n🏪 Stores (test-boutique):', stores?.length, storeError || '');
    if (stores?.length) console.log(stores[0]);

    // 2.a Check Seller Profiles
    const { data: profiles, error: profileError } = await supabase.from('seller_profiles').select('*');
    console.log('\n👤 Seller Profiles:', profiles?.length, profileError || '');
    if (profiles?.length) console.log(profiles[0]);

    // 2. Check Store Configs
    const { data: configs, error: configError } = await supabase.from('store_configs').select('*');
    console.log('\n⚙️  Store Configs:', configs?.length, configError || '');
    if (configs?.length) console.log(configs[0]);

    // 3. Check Store Pages
    const { data: pages, error: pageError } = await supabase.from('store_pages').select('*');
    console.log('\n📄 Store Pages:', pages?.length, pageError || '');
    if (pages) {
        pages.forEach(p => console.log(`   - ${p.slug} (ID: ${p.id}, StoreID: ${p.store_id}, Sections(JSON): ${!!p.sections})`));
    }

    // 4. Check Store Sections
    const { data: sections, error: sectionError } = await supabase.from('store_sections').select('*');
    console.log('\n🧩 Store Sections:', sections?.length, sectionError || '');
    if (sections) {
        sections.forEach(s => console.log(`   - [${s.section_type}] PageID: ${s.page_id || s.store_page_id} Visible: ${s.is_visible}`));
        if (sections.length > 0) console.log('First Section:', sections[0]);
    }

    // 5. Check Products
    const { count: sellerProds } = await supabase.from('seller_products').select('*', { count: 'exact', head: true });
    // Filter by the Store ID we verified earlier
    const storeId = stores?.[0]?.id;
    const { count: storeProds, error: storeProdError } = await supabase.from('store_products').select('*', { count: 'exact', head: true }).eq('store_id', storeId);
    console.log('\n📦 Products Compliance:');
    console.log('   - seller_products (Total):', sellerProds);
    console.log(`   - store_products (Store: ${storeId}):`, storeProds, storeProdError || '');

    // 6. Simulate Component Query (Anon Key)
    if (storeId) {
        console.log(`\n🕵️ Simulating Component Query for Store ${storeId}...`);
        const { data: compData, error: compError } = await supabase
            .from('store_products')
            .select(`*, product:products(*)`)
            .eq('store_id', storeId)
            .eq('is_active', true)
            .limit(8);

        console.log('   - Component Query Count:', compData?.length);
        if (compError) console.log('   - Component Query Error:', compError);
        if (compData && compData.length > 0) {
            console.log('   - First Item Product:', compData[0].product ? 'Found' : 'NULL');
            if (!compData[0].product) console.log('     -> Warning: Product join returned null. RLS on products?');
        }
    }
    const { data: pageJoined, error: joinError } = await supabase
        .from('store_pages')
        .select(`*, sections:store_sections(*)`)
        .eq('store_id', storeId)
        .eq('page_type', 'homepage')
        .single();

    console.log('Join Result:', joinError || 'Success');
    if (pageJoined) {
        console.log('Page:', pageJoined.slug);
        console.log('Sections (Joined):', pageJoined.sections?.length);
    }
}

verify();
