import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendActivationEmail, sendRejectionEmail } from "@/lib/auth-emails";

const PROFILE_STATUSES = ["pending", "approved", "suspended", "rejected"];
const ROLES = ["admin", "seller", "supplier", "creator"];
const ROLE_PROFILE_STATUSES = ["pending", "approved", "suspended", "rejected"];

export async function POST(request: Request) {
  try {
    const auth = await requireUser(["admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const normalize = (value: unknown) => (value === "active" ? "approved" : (value as string | undefined));
    const status = normalize(body?.status);
    const role = body?.role as string | undefined;
    const creatorStatus = normalize(body?.creatorStatus);
    const supplierStatus = normalize(body?.supplierStatus);

    if (!userId || (!status && !role && !creatorStatus && !supplierStatus)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if ((status && !PROFILE_STATUSES.includes(status)) || (role && !ROLES.includes(role))) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }
    if (
      (creatorStatus && !ROLE_PROFILE_STATUSES.includes(creatorStatus)) ||
      (supplierStatus && !ROLE_PROFILE_STATUSES.includes(supplierStatus))
    ) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }
    if (userId === auth.user.id && (role && role !== "admin" || status === "suspended" || status === "rejected")) {
      return NextResponse.json({ error: "You cannot demote or suspend your own account" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: targetUser } = await supabase
      .from("profiles")
      .select("email, full_name, status, role")
      .eq("id", userId)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileUpdate: Record<string, string> = { updated_at: new Date().toISOString() };
    if (status) profileUpdate.status = status;
    if (role) profileUpdate.role = role;

    const { error: updateError } = await supabase.from("profiles").update(profileUpdate).eq("id", userId);
    if (updateError) throw updateError;

    const effectiveRole = role || targetUser.role;
    const roleProfileStatus = (forRole: string, explicit?: string) =>
      explicit || (status && effectiveRole === forRole ? status : undefined);
    const creatorProfileStatus = roleProfileStatus("creator", creatorStatus);
    const supplierProfileStatus = roleProfileStatus("supplier", supplierStatus);

    if (creatorProfileStatus) {
      const { error } = await supabase.from("creator_profiles").update({ status: creatorProfileStatus }).eq("user_id", userId);
      if (error) throw error;
    }
    if (supplierProfileStatus) {
      const { error } = await supabase.from("supplier_profiles").update({ status: supplierProfileStatus }).eq("user_id", userId);
      if (error) throw error;
    }

    let emailSent = false;
    const wasActive = targetUser.status === "active" || targetUser.status === "approved";
    if (status && targetUser.email && status !== targetUser.status) {
      const firstName = targetUser.full_name?.split(" ")[0] || "Ami";
      try {
        if (status === "approved" && !wasActive) {
          await sendActivationEmail(targetUser.email, firstName);
          emailSent = true;
        } else if (status === "rejected") {
          await sendRejectionEmail(targetUser.email, firstName);
          emailSent = true;
        }
      } catch (mailError) {
        console.error("Status email failed:", mailError);
      }
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    console.error("Error in /api/admin/users/status:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
