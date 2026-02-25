import { NextResponse } from "next/server";
import { sendConfirmationEmail } from "@/lib/mail";

export async function GET() {
  try {
    await sendConfirmationEmail("ahmed@dropy.store", "test-token-123");
    return NextResponse.json({ success: true, message: "Test email sent to ahmed@dropy.store" });
  } catch (error: any) {
    console.error("Nodemailer error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
