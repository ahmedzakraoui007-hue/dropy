import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

const PLAN_CONFIG = {
  pro: {
    name: 'DROPY Pro',
    description: 'Plan Pro pour les vendeurs sérieux - Boutiques et produits illimités',
    amount: 4900,
    displayPrice: '49 TND/mois',
  },
  enterprise: {
    name: 'DROPY Enterprise',
    description: 'Plan Enterprise pour les grandes entreprises - Support dédié et SLA garanti',
    amount: 14900,
    displayPrice: '149 TND/mois',
  },
};

async function findOrCreateProduct(plan: 'pro' | 'enterprise') {
  const config = PLAN_CONFIG[plan];
  
  const existingProducts = await stripe.products.search({
    query: `metadata['plan']:'${plan}'`,
  });

  if (existingProducts.data.length > 0) {
    const product = existingProducts.data[0];
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      recurring: { interval: 'month' },
    });

    const matchingPrice = prices.data.find(p => p.unit_amount === config.amount);
    if (matchingPrice) {
      return { productId: product.id, priceId: matchingPrice.id };
    }

    const newPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.amount,
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { plan, displayPrice: config.displayPrice },
    });
    return { productId: product.id, priceId: newPrice.id };
  }

  const product = await stripe.products.create({
    name: config.name,
    description: config.description,
    metadata: { plan },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: config.amount,
    currency: 'eur',
    recurring: { interval: 'month' },
    metadata: { plan, displayPrice: config.displayPrice },
  });

  return { productId: product.id, priceId: price.id };
}

export async function POST() {
  try {
    const [pro, enterprise] = await Promise.all([
      findOrCreateProduct('pro'),
      findOrCreateProduct('enterprise'),
    ]);

    return NextResponse.json({
      success: true,
      products: { pro, enterprise },
    });
  } catch (error) {
    console.error('Error setting up Stripe products:', error);
    return NextResponse.json(
      { error: 'Failed to setup products' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [pro, enterprise] = await Promise.all([
      findOrCreateProduct('pro'),
      findOrCreateProduct('enterprise'),
    ]);

    return NextResponse.json({
      success: true,
      products: { pro, enterprise },
    });
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
