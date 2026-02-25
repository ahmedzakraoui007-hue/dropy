import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendActivationEmail, sendRejectionEmail } from "@/lib/auth-emails";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if requester is admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get target user info for email
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update status
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    // Send email based on new status
    const firstName = targetUser.full_name?.split(" ")[0] || "Ami";
    
    if (status === "active" || status === "approved") {
      await sendActivationEmail(targetUser.email!, firstName);
    } else if (status === "rejected") {
      await sendRejectionEmail(targetUser.email!, firstName);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in /api/admin/users/status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
