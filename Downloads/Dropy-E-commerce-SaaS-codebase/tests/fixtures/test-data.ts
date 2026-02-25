export const TEST_USERS = {
    seller: {
        email: 'test-seller@dropy.tn',
        password: 'TestPassword123!',
        storeName: 'Test Boutique',
        storeSlug: 'test-boutique',
        phone: '12345678',
    },
    supplier: {
        email: 'test-supplier@dropy.tn',
        password: 'TestPassword123!',
        companyName: 'Test Supplier Co',
    },
    creator: {
        email: 'test-creator@dropy.tn',
        password: 'TestPassword123!',
        displayName: 'Test Creator',
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
