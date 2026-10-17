import { createAdminClient } from "@/lib/supabase/admin";
import { syncStoreOrdersFromSupplier } from "@/lib/order-sync";

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente d'enlèvement",
  pickup_scheduled: "Enlèvement programmé",
  picked_up: "Colis enlevé par le livreur",
  in_transit: "Colis en transit",
  out_for_delivery: "Colis en cours de livraison",
  delivered: "Colis livré avec succès",
  failed: "Échec de la livraison",
  returned: "Colis retourné",
};

export interface ShipmentUpdate {
  status: string;
  description?: string;
  location?: string;
  timestamp?: string;
  receiver_name?: string;
  signature_url?: string;
  photo_url?: string;
  cod_collected?: boolean;
  failure_reason?: string;
  raw?: unknown;
}

export async function applyShipmentStatus(shipmentId: string, input: ShipmentUpdate) {
  const supabase = createAdminClient();
  const { data: shipment } = await supabase.from("delivery_shipments").select("*").eq("id", shipmentId).maybeSingle();
  if (!shipment) return null;

  const now = new Date().toISOString();
  const newStatus = input.status;
  const updateData: Record<string, unknown> = { delivery_status: newStatus, updated_at: now };

  if (newStatus === "picked_up") {
    updateData.pickup_status = "picked_up";
    updateData.pickup_completed_at = now;
  }

  if (newStatus === "delivered") {
    updateData.delivered_at = now;
    if (input.receiver_name) updateData.receiver_name = input.receiver_name;
    if (input.signature_url) updateData.delivery_signature = input.signature_url;
    if (input.photo_url) updateData.delivery_photo = input.photo_url;
    if (input.cod_collected) updateData.cod_collected = true;
  }

  if (newStatus === "failed") {
    updateData.delivery_attempts = (shipment.delivery_attempts || 0) + 1;
    updateData.failure_reason = input.failure_reason || null;
  }

  await supabase.from("delivery_shipments").update(updateData).eq("id", shipment.id);

  await supabase.from("shipment_tracking_events").insert({
    shipment_id: shipment.id,
    event_type: newStatus,
    event_description: input.description || SHIPMENT_STATUS_LABELS[newStatus] || newStatus,
    event_location: input.location || null,
    event_timestamp: input.timestamp || now,
    raw_data: input.raw ?? input,
  });

  if (shipment.supplier_order_id && (newStatus === "picked_up" || newStatus === "delivered")) {
    const supplierStatus = newStatus === "picked_up" ? "shipped" : "delivered";
    await supabase
      .from("supplier_orders")
      .update(
        newStatus === "picked_up"
          ? { status: supplierStatus, picked_up_at: now, shipped_at: now, updated_at: now }
          : { status: supplierStatus, delivered_at: now, updated_at: now }
      )
      .eq("id", shipment.supplier_order_id);
    await syncStoreOrdersFromSupplier(shipment.supplier_order_id, supplierStatus);
  }

  return { ...shipment, ...updateData };
}
