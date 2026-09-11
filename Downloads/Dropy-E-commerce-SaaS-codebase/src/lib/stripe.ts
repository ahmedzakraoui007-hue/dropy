import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY manquante');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }

  return stripeClient;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    return Reflect.get(getStripe(), property, receiver);
  },
});

export const PLANS: Record<string, {
  name: string;
  priceId: string | null;
  price: number;
  displayPrice: string;
  features: string[];
  limits: { stores: number; products: number };
}> = {
  starter: {
    name: 'Starter',
    priceId: null,
    price: 0,
    displayPrice: '0 TND/mois',
    features: [
      '1 boutique',
      '50 produits max',
      'Templates basiques',
      'Support email',
    ],
    limits: {
      stores: 1,
      products: 50,
    },
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || null, 
    price: 4900,
    displayPrice: '49 TND/mois',
    features: [
      'Boutiques illimitées',
      'Produits illimités',
      'Tous les templates',
      'Domaine personnalisé',
      'Analytics avancés',
      'Support prioritaire',
    ],
    limits: {
      stores: -1,
      products: -1,
    },
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
    price: 14900,
    displayPrice: '149 TND/mois',
    features: [
      'Tout de Pro',
      'API personnalisée',
      'Account manager dédié',
      'Formations privées',
      'SLA garanti',
    ],
    limits: {
      stores: -1,
      products: -1,
    },
  },
};

export type PlanType = keyof typeof PLANS;

export async function ensurePriceIds() {
  if (PLANS.pro.priceId && PLANS.enterprise.priceId) {
    return PLANS;
  }
  
  const proPrices = await stripe.prices.search({
    query: `metadata['plan']:'pro' active:'true'`,
  });
  
  const enterprisePrices = await stripe.prices.search({
    query: `metadata['plan']:'enterprise' active:'true'`,
  });

  if (proPrices.data.length > 0) {
    PLANS.pro.priceId = proPrices.data[0].id;
  }
  
  if (enterprisePrices.data.length > 0) {
    PLANS.enterprise.priceId = enterprisePrices.data[0].id;
  }

  return PLANS;
}
