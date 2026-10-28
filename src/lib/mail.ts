import nodemailer, { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function getTransporter() {
  if (!isMailConfigured()) {
    throw new Error('Configuration SMTP manquante (SMTP_HOST, SMTP_USER, SMTP_PASS)')
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  return transporter
}

function fromAddress() {
  return process.env.SMTP_FROM || `Dropy <${process.env.SMTP_USER}>`
}

async function deliver({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  const info = await getTransporter().sendMail({
    from: fromAddress(),
    to,
    subject,
    html,
    replyTo,
  })
  console.log('✅ [Mail] Email envoyé avec succès. ID:', info.messageId)
  return info
}

/**
 * Generic function to send email via SMTP (nodemailer)
 */
export async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  try {
    console.log('📧 [Mail] Envoi email à:', to)

    if (!isMailConfigured()) {
      console.warn('⚠️ Configuration SMTP manquante, l\'envoi d\'email sera ignoré')
      return null
    }

    return await deliver({ to, subject, html, replyTo })
  } catch (error) {
    console.error('💥 [Mail] Erreur fatale sendEmail:', error)
    throw error
  }
}

export async function sendWaitingEmail(email: string, firstName: string) {
  try {
    console.log('📧 [Mail] Envoi email attente à:', email)

    return await deliver({
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
  } catch (error) {
    console.error('💥 [Mail] Erreur fatale:', error)
    throw error
  }
}

export async function sendConfirmationEmail(email: string, confirmationLink: string) {
  try {
    console.log('📧 [Mail] Envoi email confirmation à:', email)

    return await deliver({
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
  } catch (error) {
    console.error('💥 [Mail] Erreur fatale:', error)
    throw error
  }
}
