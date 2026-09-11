export interface Address {
  street: string;
  city: string;
  postal_code?: string;
  governorate?: string;
  country: string;
  notes?: string;
}

export interface CreateShipmentParams {
  pickup: {
    company_name: string;
    contact_name: string;
    phone: string;
    address: Address;
    notes?: string;
  };
  delivery: {
    contact_name: string;
    phone: string;
    address: Address;
    notes?: string;
  };
  items: {
    description: string;
    quantity: number;
    weight?: number;
  }[];
  cod_amount?: number;
  preferred_pickup_date?: Date;
  service_type?: 'standard' | 'express';
  reference?: string;
}

export interface ShipmentResult {
  tracking_id: string;
  tracking_url: string;
  pickup_date: Date;
  estimated_delivery: Date;
  cost: number;
  label_url?: string;
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: string;
}

export interface TrackingInfo {
  status: string;
  current_location?: string;
  events: TrackingEvent[];
}

export interface DeliveryProvider {
  name: string;
  createShipment(params: CreateShipmentParams): Promise<ShipmentResult>;
  cancelShipment(trackingId: string): Promise<boolean>;
  getTracking(trackingId: string): Promise<TrackingInfo>;
}

export type DeliveryStatus = 
  | 'pending'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export type SupplierOrderStatus = 
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';
