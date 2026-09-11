import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { storeId, pagePath, referrer } = await req.json();
    
    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // We don't necessarily need the user to be authenticated for a store visit
    // but we can track visitor_id via a cookie if we wanted. For now, we'll just log it.
    
    const { error } = await supabase.from("store_visits").insert({
      store_id: storeId,
      page_path: pagePath,
      referrer: referrer,
      user_agent: req.headers.get("user-agent") || undefined,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging visit:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
