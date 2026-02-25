import { SupabaseClient } from '@supabase/supabase-js';
import { TEST_USERS } from '../fixtures/test-data';

export async function seedUsers(supabase: SupabaseClient) {
    const users: Record<string, { id: string; profileId: string; email: string }> = {};

    // === SELLER ===
    const sellerAuth = await createOrGetUser(supabase, TEST_USERS.seller.email, TEST_USERS.seller.password);

    // Seed 'profiles' table if it exists (FK requirement for some tables)
    await ensureProfile(supabase, 'profiles', {
        id: sellerAuth.id,
        email: TEST_USERS.seller.email,
    }, 'id');

    const sellerProfile = await ensureProfile(supabase, 'seller_profiles', {
        user_id: sellerAuth.id,
        store_name: TEST_USERS.seller.storeName,
        store_slug: TEST_USERS.seller.storeSlug,
    });
    users.seller = { id: sellerAuth.id, profileId: sellerProfile.id, email: TEST_USERS.seller.email };

    // === SUPPLIER ===
    const supplierAuth = await createOrGetUser(supabase, TEST_USERS.supplier.email, TEST_USERS.supplier.password);

    await ensureProfile(supabase, 'profiles', {
        id: supplierAuth.id,
        email: TEST_USERS.supplier.email,
    }, 'id');

    const supplierProfile = await ensureProfile(supabase, 'supplier_profiles', {
        user_id: supplierAuth.id,
        company_name: TEST_USERS.supplier.companyName,
    });
    users.supplier = { id: supplierAuth.id, profileId: supplierProfile.id, email: TEST_USERS.supplier.email };

    // === CREATOR ===
    const creatorAuth = await createOrGetUser(supabase, TEST_USERS.creator.email, TEST_USERS.creator.password);
    /*
    const creatorProfile = await ensureProfile(supabase, 'creator_profiles', {
        user_id: creatorAuth.id,
        display_name: TEST_USERS.creator.displayName,
    });
    users.creator = { id: creatorProfile.id, email: TEST_USERS.creator.email };
    */
    users.creator = { id: creatorAuth.id, profileId: '', email: TEST_USERS.creator.email };

    return users;
}

async function ensureProfile(supabase: SupabaseClient, table: string, data: any, matchKey: string = 'user_id') {
    // 1. Check if exists
    const { data: existing, error: findError } = await supabase
        .from(table)
        .select('*') // Select all to see PK
        .eq(matchKey, data[matchKey])
        .maybeSingle();

    if (findError) {
        // If table profiles doesn't exist, we might get 404/PGRST205 or similar.
        // We warn and continue if 'profiles' table is missing, but if it's required for FK, it MUST exist.
        if (findError.code === 'PGRST205') {
            console.warn(`⚠️ Table ${table} does not exist. Skipping.`);
            return {};
        }
        console.error(`❌ Error finding profile in ${table}:`, findError);
        throw findError;
    }

    if (existing) {
        // console.log(`Found existing profile for ${table} (ID: ${existing.id}). Updating...`);
        // Update
        const { data: updated, error: updateError } = await supabase
            .from(table)
            .update(data)
            .eq(matchKey, existing[matchKey]) // Use matchKey for update condition if it's unique
            .select()
            .single();

        if (updateError) {
            console.error(`❌ Error updating profile in ${table}:`, updateError);
            if (updateError.code === 'PGRST116') {
                console.warn(`⚠️ Update returned 0 rows for ${table}. Using existing.`);
                return existing;
            }
            throw updateError;
        }
        return updated;
    } else {
        // Insert
        const { data: inserted, error: insertError } = await supabase
            .from(table)
            .insert(data)
            .select()
            .single();

        if (insertError) {
            console.error(`❌ Error inserting profile in ${table}:`, insertError);
            throw insertError;
        }
        return inserted;
    }
}

async function createOrGetUser(supabase: SupabaseClient, email: string, password: string) {
    // Try to sign in to get user
    const { data: linkData, error: linkError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (!linkError && linkData.user) {
        return linkData.user;
    }

    // Not found or login failed, try create
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (error) {
        if (error.code === 'email_exists' || error.message.includes('already been registered')) {
            console.error(`❌ User ${email} exists but login failed (wrong password?). Cannot retrieve ID.`);
        }
        console.error(`❌ Error creating user ${email}:`, error);
        throw error;
    }
    return data.user;
}
