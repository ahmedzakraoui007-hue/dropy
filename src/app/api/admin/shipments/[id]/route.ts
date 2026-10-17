import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { applyShipmentStatus } from "@/lib/shipments";

const ALLOWED = ["picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const shipment = await applyShipmentStatus(id, {
    status: body.status,
    failure_reason: body.failure_reason,
    cod_collected: body.status === "delivered" ? true : undefined,
    description: body.description,
    raw: { source: "admin", admin_id: auth.user.id },
  });

  if (!shipment) return NextResponse.json({ error: "Expédition introuvable" }, { status: 404 });
  return NextResponse.json({ success: true, shipment });
}
