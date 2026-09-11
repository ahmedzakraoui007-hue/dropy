import { SupabaseClient } from '@supabase/supabase-js';

const GOVERNORATES = [
    { name_fr: 'Tunis', name_ar: 'تونس', shipping_zone: 1, base_shipping_cost: 7.00 },
    { name_fr: 'Ariana', name_ar: 'أريانة', shipping_zone: 1, base_shipping_cost: 7.00 },
    { name_fr: 'Ben Arous', name_ar: 'بن عروس', shipping_zone: 1, base_shipping_cost: 7.00 },
    { name_fr: 'Manouba', name_ar: 'منوبة', shipping_zone: 1, base_shipping_cost: 7.00 },
    { name_fr: 'Nabeul', name_ar: 'نابل', shipping_zone: 2, base_shipping_cost: 8.00 },
    { name_fr: 'Zaghouan', name_ar: 'زغوان', shipping_zone: 2, base_shipping_cost: 8.00 },
    { name_fr: 'Bizerte', name_ar: 'بنزرت', shipping_zone: 2, base_shipping_cost: 8.00 },
    { name_fr: 'Béja', name_ar: 'باجة', shipping_zone: 2, base_shipping_cost: 9.00 },
    { name_fr: 'Jendouba', name_ar: 'جندوبة', shipping_zone: 2, base_shipping_cost: 9.00 },
    { name_fr: 'Le Kef', name_ar: 'الكاف', shipping_zone: 2, base_shipping_cost: 9.00 },
    { name_fr: 'Siliana', name_ar: 'سليانة', shipping_zone: 2, base_shipping_cost: 9.00 },
    { name_fr: 'Sousse', name_ar: 'سوسة', shipping_zone: 3, base_shipping_cost: 8.00 },
    { name_fr: 'Monastir', name_ar: 'المنستير', shipping_zone: 3, base_shipping_cost: 8.00 },
    { name_fr: 'Mahdia', name_ar: 'المهدية', shipping_zone: 3, base_shipping_cost: 8.00 },
    { name_fr: 'Sfax', name_ar: 'صفاقس', shipping_zone: 3, base_shipping_cost: 9.00 },
    { name_fr: 'Kairouan', name_ar: 'القيروان', shipping_zone: 3, base_shipping_cost: 9.00 },
    { name_fr: 'Kasserine', name_ar: 'القصرين', shipping_zone: 3, base_shipping_cost: 10.00 },
    { name_fr: 'Sidi Bouzid', name_ar: 'سيدي بوزيد', shipping_zone: 3, base_shipping_cost: 10.00 },
    { name_fr: 'Gabès', name_ar: 'قابس', shipping_zone: 4, base_shipping_cost: 10.00 },
    { name_fr: 'Medenine', name_ar: 'مدنين', shipping_zone: 4, base_shipping_cost: 11.00 },
    { name_fr: 'Tataouine', name_ar: 'تطاوين', shipping_zone: 4, base_shipping_cost: 12.00 },
    { name_fr: 'Gafsa', name_ar: 'قفصة', shipping_zone: 4, base_shipping_cost: 11.00 },
    { name_fr: 'Tozeur', name_ar: 'توزر', shipping_zone: 4, base_shipping_cost: 12.00 },
    { name_fr: 'Kebili', name_ar: 'قبلي', shipping_zone: 4, base_shipping_cost: 12.00 },
];

export async function seedGovernorates(supabase: SupabaseClient) {
    const { error } = await supabase
        .from('governorates')
        .upsert(GOVERNORATES, { onConflict: 'name_fr' });

    if (error) {
        console.error('Erreur seed gouvernorats:', error);
        throw error;
    }
}
