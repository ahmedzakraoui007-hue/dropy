import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userId, 
      type, 
      title, 
      message, 
      link, 
      icon, 
      payload, 
      sendEmail 
    } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { sendNotification } = await import("@/lib/notifications");
    await sendNotification({
      userId,
      type: type as any,
      title,
      message,
      link,
      icon,
      payload,
      sendEmail: sendEmail ?? true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in /api/notifications/send:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
