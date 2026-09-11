import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/mail";

export type NotificationType = 
  | "order_received" 
  | "order_shipped" 
  | "brief_accepted" 
  | "deliverable_submitted" 
  | "payment_received" 
  | "dispute_opened" 
  | "dispute_resolved" 
  | "quota_limit";

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  icon?: string;
  payload?: any;
  sendEmail?: boolean;
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
  link,
  icon,
  payload = {},
  sendEmail: shouldSendEmail = true,
}: SendNotificationParams) {
  const supabase = await createClient();

  // 1. Get user preferences and email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  // If no preferences exist, we assume default values (true for all except marketing)
  const userPrefs = prefs || {
    in_app_notifications: true,
    email_notifications: true,
    order_updates: true,
    content_updates: true,
    payment_updates: true,
  };

  // Determine if we should send in-app and email based on type and prefs
  let shouldInApp = userPrefs.in_app_notifications;
  let shouldEmail = userPrefs.email_notifications && shouldSendEmail;

  const typeToPref: Record<string, keyof typeof userPrefs> = {
    order_received: "order_updates",
    order_shipped: "order_updates",
    brief_accepted: "content_updates",
    deliverable_submitted: "content_updates",
    payment_received: "payment_updates",
    dispute_opened: "payment_updates",
    dispute_resolved: "payment_updates",
    quota_limit: "payment_updates",
  };

  const categoryPref = typeToPref[type];
  if (categoryPref && !userPrefs[categoryPref]) {
    shouldInApp = false;
    shouldEmail = false;
  }

  // 2. Create In-App Notification if enabled
  let notificationId = null;
  if (shouldInApp) {
    const { data: notification, error: dbError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        icon,
        payload,
        is_read: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating notification:", dbError);
    } else {
      notificationId = notification.id;
    }
  }

  // 3. Send Email if enabled
  if (shouldEmail && profile?.email) {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6d28d9; margin: 0;">DROPY</h1>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 24px;" />
        <h2 style="color: #1f2937; margin-bottom: 16px;">${title}</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          Bonjour ${profile.full_name || 'Utilisateur'},<br/><br/>
          ${message}
        </p>
        ${link ? `
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dropy.store'}${link}" 
               style="background-color: #6d28d9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">
              Voir les détails
            </a>
          </div>
        ` : ""}
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Ceci est une notification automatique de Dropy. Vous pouvez gérer vos préférences de notification dans vos paramètres.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: profile.email,
        subject: title,
        html: emailHtml,
      });
      
      if (notificationId) {
        await supabase.from("notifications").update({ email_sent: true }).eq("id", notificationId);
      }
    } catch (err) {
      console.error("Failed to send email notification:", err);
    }
  }

  return { success: true };
}
