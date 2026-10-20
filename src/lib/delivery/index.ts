import { randomBytes } from 'node:crypto';
import { DeliveryProvider, CreateShipmentParams, ShipmentResult } from './types';
import { DropyInternalProvider, TunisieLivraisonProvider } from './providers';

const providers: Record<string, DeliveryProvider> = {
  dropy_internal: new DropyInternalProvider(),
  tunisie_livraison: new TunisieLivraisonProvider(),
};

export function getDeliveryProvider(name: string): DeliveryProvider {
  const provider = providers[name];
  if (!provider) {
    console.warn(`Unknown delivery provider: ${name}, using dropy_internal`);
    return providers.dropy_internal;
  }
  return provider;
}

export async function createDeliveryShipment(
  params: CreateShipmentParams,
  providerName: string = 'dropy_internal'
): Promise<ShipmentResult> {
  const provider = getDeliveryProvider(providerName);
  return provider.createShipment(params);
}

export function generatePackageCode(orderId: string): string {
  return `DRP-PKG-${orderId.slice(0, 8).toUpperCase()}`;
}

export function generateSupplierOrderNumber(): string {
  const year = new Date().getFullYear();
  return `SUP-${year}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function generateShipmentNumber(): string {
  return `SHP-${randomBytes(6).toString('hex').toUpperCase()}`;
}

export * from './types';
export * from './providers';
