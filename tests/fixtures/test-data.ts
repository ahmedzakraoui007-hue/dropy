export const TEST_USERS = {
    seller: {
        email: process.env.E2E_SELLER_EMAIL || 'seller.test@dropy.store',
        password: process.env.E2E_SELLER_PASSWORD || '',
        storeName: 'Test Boutique',
        storeSlug: 'test-boutique',
        phone: '12345678',
    },
    supplier: {
        email: process.env.E2E_SUPPLIER_EMAIL || 'supplier.test@dropy.store',
        password: process.env.E2E_SUPPLIER_PASSWORD || '',
        companyName: 'Test Supplier Co',
    },
    creator: {
        email: process.env.E2E_CREATOR_EMAIL || 'creator.test@dropy.store',
        password: process.env.E2E_CREATOR_PASSWORD || '',
        displayName: 'Test Creator',
    },
    admin: {
        email: process.env.E2E_ADMIN_EMAIL || 'admin@dropy.store',
        password: process.env.E2E_ADMIN_PASSWORD || '',
    },
    customer: {
        name: 'Ahmed Ben Ali',
        phone: '98765432',
        email: 'client@test.tn',
        governorate: 'Tunis',
        city: 'La Marsa',
        address: '123 Rue Test, Appartement 4B',
    },
};

// Slug de la boutique de test (doit correspondre à seller.storeSlug)
export const TEST_STORE_SLUG = 'test-boutique';

export const TEST_PRODUCT = {
    name: 'T-shirt Test Premium',
    description: 'Un t-shirt de test pour les tests E2E',
    price: 45.000,
    category: 'Mode Homme',
};

export const GOVERNORATES = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
    'Nabeul', 'Sousse', 'Sfax', 'Bizerte',
    // ... autres
];
