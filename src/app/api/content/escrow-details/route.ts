import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { escrowPaymentDetails } from "@/lib/content-escrow";

export async function GET() {
  const auth = await requireUser(["seller", "admin"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ paymentDetails: await escrowPaymentDetails() });
}
