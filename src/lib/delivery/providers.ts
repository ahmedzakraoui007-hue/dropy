import { DeliveryProvider, CreateShipmentParams, ShipmentResult, TrackingInfo } from './types';

export class DropyInternalProvider implements DeliveryProvider {
  name = 'dropy_internal';
  
  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const trackingId = `DRP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const pickupDate = params.preferred_pickup_date || new Date(Date.now() + 24 * 60 * 60 * 1000);
    const estimatedDelivery = new Date(pickupDate.getTime() + (params.service_type === 'express' ? 1 : 3) * 24 * 60 * 60 * 1000);
    
    const baseCost = params.service_type === 'express' ? 12 : 7;
    const weightCost = params.items.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0) * 2;
    
    return {
      tracking_id: trackingId,
      tracking_url: `/track/${trackingId}`,
      pickup_date: pickupDate,
      estimated_delivery: estimatedDelivery,
      cost: baseCost + weightCost,
    };
  }
  
  async cancelShipment(trackingId: string): Promise<boolean> {
    return true;
  }
  
  async getTracking(trackingId: string): Promise<TrackingInfo> {
    return {
      status: 'pending',
      events: [],
    };
  }
}

export class TunisieLivraisonProvider implements DeliveryProvider {
  name = 'tunisie_livraison';
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.TUNISIE_LIVRAISON_API_KEY || '';
    this.baseUrl = process.env.TUNISIE_LIVRAISON_API_URL || 'https://api.tunisielivraison.tn/v1';
  }
  
  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    if (!this.apiKey) {
      console.log('Tunisie Livraison API not configured, using mock data');
      return this.mockCreateShipment(params);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: params.pickup.contact_name,
            company: params.pickup.company_name,
            phone: params.pickup.phone,
            address: params.pickup.address.street,
            city: params.pickup.address.city,
            postal_code: params.pickup.address.postal_code,
            notes: params.pickup.notes,
          },
          recipient: {
            name: params.delivery.contact_name,
            phone: params.delivery.phone,
            address: params.delivery.address.street,
            city: params.delivery.address.city,
            postal_code: params.delivery.address.postal_code,
            notes: params.delivery.notes,
          },
          packages: params.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            weight: item.weight || 0.5,
          })),
          cod: params.cod_amount || 0,
          service: params.service_type || 'standard',
          reference: params.reference,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create shipment');
      }
      
      const data = await response.json();
      
      return {
        tracking_id: data.tracking_number,
        tracking_url: `https://tunisielivraison.tn/track/${data.tracking_number}`,
        pickup_date: new Date(data.pickup_date),
        estimated_delivery: new Date(data.estimated_delivery),
        cost: data.shipping_cost,
        label_url: data.label_url,
      };
    } catch (error) {
      console.error('Tunisie Livraison API error:', error);
      return this.mockCreateShipment(params);
    }
  }
  
  private mockCreateShipment(params: CreateShipmentParams): ShipmentResult {
    const trackingId = `TL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const pickupDate = params.preferred_pickup_date || new Date(Date.now() + 24 * 60 * 60 * 1000);
    const estimatedDelivery = new Date(pickupDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    return {
      tracking_id: trackingId,
      tracking_url: `/track/${trackingId}`,
      pickup_date: pickupDate,
      estimated_delivery: estimatedDelivery,
      cost: 8,
    };
  }
  
  async cancelShipment(trackingId: string): Promise<boolean> {
    if (!this.apiKey) return true;
    
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${trackingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async getTracking(trackingId: string): Promise<TrackingInfo> {
    if (!this.apiKey) {
      return { status: 'pending', events: [] };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/tracking/${trackingId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      if (!response.ok) {
        return { status: 'unknown', events: [] };
      }
      
      const data = await response.json();
      
      return {
        status: data.status,
        current_location: data.current_location,
        events: data.events?.map((e: any) => ({
          timestamp: new Date(e.date),
          status: e.status,
          description: e.description,
          location: e.location,
        })) || [],
      };
    } catch {
      return { status: 'unknown', events: [] };
    }
  }
}
