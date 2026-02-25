import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/mail";

/**
 * These emails are sent manually via API or Triggers.
 * Since you configured Resend with Supabase SMTP, these will go through Resend.
 */

const LOGO_URL = "https://ybpfkbwwiuaqppiytvkb.supabase.co/storage/v1/object/public/assets/logo-dropy.png"; // Replace with actual logo URL

export async function sendWaitingEmail(email: string, firstName: string, lang: string = "fr") {
  const subject = lang === "ar" ? "طلبك في دروبي قيد المراجعة" : "Votre demande Dropy est en cours d'examen";
  
  const content = lang === "ar" ? {
    title: "مرحباً بك في دروبي ! ✅",
    body: `مرحباً ${firstName},<br/><br/>تم تأكيد بريدك الإلكتروني بنجاح. طلب انضمامك إلى دروبي هو الآن قيد المراجعة من قبل فريقنا.<br/><br/>نحن نقوم بدراسة كل طلب بعناية لضمان أفضل جودة خدمة. ستتلقى رداً منا في غضون 24-48 ساعة.`,
    resources_title: "في انتظار ذلك، اكتشف مواردنا :",
    blog: "المدونة",
    faq: "الأسئلة الشائعة",
    footer: "نراك قريباً !<br/>فريق دروبي",
    dir: "rtl"
  } : {
    title: "Votre email est confirmé ! ✅",
    body: `Bonjour ${firstName},<br/><br/>Votre demande d'accès à Dropy est maintenant entre les mains de notre équipe.<br/><br/>Nous examinons chaque candidature pour offrir le meilleur accompagnement possible. Vous recevrez une réponse sous 24-48h.`,
    resources_title: "En attendant, découvrez nos ressources :",
    blog: "Blog",
    faq: "FAQ",
    footer: "À très bientôt !<br/>L'équipe Dropy",
    dir: "ltr"
  };

  const html = `
    <div dir="${content.dir}" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; color: #1f2937; text-align: ${content.dir === 'rtl' ? 'right' : 'left'};">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">DROPY</h1>
      </div>
      <h2 style="color: #111827; margin-bottom: 20px; font-size: 22px;">${content.title}</h2>
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px; font-size: 16px;">
        ${content.body}
      </p>
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 12px 0; font-weight: bold; color: #374151;">${content.resources_title}</p>
        <ul style="color: #4b5563; margin: 0; padding-inline-start: 20px;">
          <li style="margin-bottom: 8px;">${content.blog} : <a href="https://dropyblog.vercel.app" style="color: #4f46e5; font-weight: 600; text-decoration: none;">dropyblog.vercel.app</a></li>
          <li>${content.faq} : <a href="https://dropy.store/faq" style="color: #4f46e5; font-weight: 600; text-decoration: none;">dropy.store/faq</a></li>
        </ul>
      </div>
      <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 48px; border-top: 1px solid #f1f5f9; pt-24px;">
        ${content.footer}
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: email, subject, html });
  } catch (error) {
    console.error("Error sending waiting email:", error);
  }
}

export async function sendActivationEmail(email: string, firstName: string, lang: string = "fr") {
  const subject = lang === "ar" ? "🎉 مرحباً بك في دروبي - تم تفعيل حسابك !" : "🎉 Bienvenue sur Dropy - Votre compte est activé !";
  
  const content = lang === "ar" ? {
    title: "أخبار رائعة ! 🚀",
    body: `مرحباً ${firstName},<br/><br/>تم تفعيل حسابك في دروبي بنجاح. يمكنك الآن تسجيل الدخول والبدء في استكشاف المنصة.`,
    cta: "الدخول إلى حسابي",
    steps_title: "الخطوات التالية :",
    step1: "أكمل ملفك الشخصي",
    step2: "استكشف كتالوج المنتجات",
    step3: "أنشئ متجرك الأول",
    footer: "مرحباً بك في مغامرة دروبي !<br/>فريق دروبي",
    dir: "rtl"
  } : {
    title: "Excellente nouvelle ! 🚀",
    body: `Bonjour ${firstName},<br/><br/>Votre compte Dropy a été activé. Vous pouvez maintenant vous connecter et commencer à explorer la plateforme.`,
    cta: "ACCÉDER À MON COMPTE",
    steps_title: "Prochaines étapes :",
    step1: "Complétez votre profil",
    step2: "Explorez le catalogue produits",
    step3: "Créez votre première boutique",
    footer: "Bienvenue dans l'aventure Dropy !<br/>L'équipe Dropy",
    dir: "ltr"
  };

  const html = `
    <div dir="${content.dir}" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; color: #1f2937; text-align: ${content.dir === 'rtl' ? 'right' : 'left'};">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">DROPY</h1>
      </div>
      <h2 style="color: #111827; margin-bottom: 20px; font-size: 22px;">${content.title}</h2>
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 32px; font-size: 16px;">
        ${content.body}
      </p>
      <div style="text-align: center; margin-bottom: 40px;">
        <a href="https://dropy.store/login" 
           style="background-color: #4f46e5; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);">
          ${content.cta}
        </a>
      </div>
      <div style="background-color: #f0fdf4; padding: 24px; border-radius: 12px; border: 1px solid #dcfce7;">
        <p style="margin: 0 0 12px 0; font-weight: bold; color: #166534;">${content.steps_title}</p>
        <ol style="color: #166534; margin: 0; padding-inline-start: 20px;">
          <li style="margin-bottom: 8px;">${content.step1}</li>
          <li style="margin-bottom: 8px;">${content.step2}</li>
          <li>${content.step3}</li>
        </ol>
      </div>
      <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 48px; border-top: 1px solid #f1f5f9; pt-24px;">
        ${content.footer}
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: email, subject, html });
  } catch (error) {
    console.error("Error sending activation email:", error);
  }
}

export async function sendRejectionEmail(email: string, firstName: string, lang: string = "fr") {
  const subject = lang === "ar" ? "بخصوص طلب انضمامك إلى دروبي" : "Concernant votre demande Dropy";
  
  const content = lang === "ar" ? {
    title: "تحديث بخصوص طلبك ℹ️",
    body: `مرحباً ${firstName},<br/><br/>نشكرك على اهتمامك بـ دروبي. بعد مراجعة طلبك، نأسف لإبلاغك بأنه لا يمكننا قبوله في الوقت الحالي.<br/><br/>نحن نبحث عن ملفات شخصية محددة جداً في هذه المرحلة من تطورنا.`,
    footer: "شكراً لتفهمك،<br/>فريق دروبي",
    dir: "rtl"
  } : {
    title: "Mise à jour de votre demande ℹ️",
    body: `Bonjour ${firstName},<br/><br/>Nous vous remercions de l'intérêt porté à Dropy. Après examen de votre dossier, nous avons le regret de vous informer que nous ne pouvons pas donner suite à votre demande pour le moment.<br/><br/>Nous recherchons des profils très spécifiques à cette étape de notre développement.`,
    footer: "Merci de votre compréhension,<br/>L'équipe Dropy",
    dir: "ltr"
  };

  const html = `
    <div dir="${content.dir}" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; color: #1f2937; text-align: ${content.dir === 'rtl' ? 'right' : 'left'};">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">DROPY</h1>
      </div>
      <h2 style="color: #111827; margin-bottom: 20px; font-size: 22px;">${content.title}</h2>
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px; font-size: 16px;">
        ${content.body}
      </p>
      <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 48px; border-top: 1px solid #f1f5f9; pt-24px;">
        ${content.footer}
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: email, subject, html });
  } catch (error) {
    console.error("Error sending rejection email:", error);
  }
}
