import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const supabase = createAdminClient();

    // 1. Generate recovery link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${new URL(req.url).origin}/auth/reset-password`,
      },
    });

    if (linkError) {
      // Don't reveal if user exists or not for security, but handle actual errors
      if (linkError.message.includes("User not found")) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    // 2. Send email via Nodemailer
    const resetUrl = linkData.properties.action_link;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Réinitialisation de votre mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe Dropy. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
        <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">L'équipe Dropy</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Réinitialisation de votre mot de passe Dropy",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
