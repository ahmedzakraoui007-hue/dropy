import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY manquante')
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

/**
 * Generic function to send email via Resend
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    console.log('📧 [Mail] Envoi email à:', to)
    
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY manquante, l\'envoi d\'email sera ignoré')
      return null
    }

    const { data, error } = await getResend().emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('❌ [Mail] Erreur Resend:', error)
      throw error
    }

    console.log('✅ [Mail] Email envoyé avec succès. ID:', data?.id)
    return data

  } catch (error) {
    console.error('💥 [Mail] Erreur fatale sendEmail:', error)
    throw error
  }
}

export async function sendWaitingEmail(email: string, firstName: string) {
  try {
    console.log('📧 [Mail] Envoi email attente à:', email)
    
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY manquante')
    }

    const { data, error } = await getResend().emails.send({
      from: 'onboarding@resend.dev', // ← Utiliser cet email de test
      to: email,
      subject: 'Votre demande est en cours de révision - Dropy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Bonjour ${firstName} !</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Votre demande d'inscription sur Dropy a bien été reçue et est actuellement en cours de révision par notre équipe.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Vous recevrez un email de confirmation dès que votre compte sera validé.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Merci de votre patience !<br>
            L'équipe Dropy
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('❌ [Mail] Erreur Resend:', error)
      throw error
    }

    console.log('✅ [Mail] Email envoyé avec succès. ID:', data?.id)
    return data

  } catch (error) {
    console.error('💥 [Mail] Erreur fatale:', error)
    throw error
  }
}

export async function sendConfirmationEmail(email: string, confirmationLink: string) {
  try {
    console.log('📧 [Mail] Envoi email confirmation à:', email)

    const { data, error } = await getResend().emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Confirmez votre adresse email - Dropy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Bienvenue sur Dropy !</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Merci de vous être inscrit. Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a 
              href="${confirmationLink}" 
              style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;"
            >
              Confirmer mon email
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            Si vous n'avez pas créé de compte sur Dropy, vous pouvez ignorer cet email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('❌ [Mail] Erreur Resend:', error)
      throw error
    }

    console.log('✅ [Mail] Email confirmation envoyé. ID:', data?.id)
    return data

  } catch (error) {
    console.error('💥 [Mail] Erreur fatale:', error)
    throw error
  }
}
