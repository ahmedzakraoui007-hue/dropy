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
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SUP-${year}-${random}`;
}

export function generateShipmentNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SHP-${timestamp}-${random}`;
}

export * from './types';
export * from './providers';
