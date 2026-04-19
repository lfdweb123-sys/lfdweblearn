// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'LFD Web Learn <noreply@lfdweblearn.com>'

// ── Email de bienvenue apres inscription ─────────────────────
export async function sendWelcomeEmail(to: string, displayName: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Bienvenue sur LFD Web Learn !',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#0284c7;font-size:28px;margin:0">
              LFD <span style="color:#f97316">Web Learn</span>
            </h1>
          </div>
          <div style="background:#f8fafc;border-radius:16px;padding:32px">
            <h2 style="color:#1e293b;margin-top:0">Bienvenue, ${displayName} ! 🎉</h2>
            <p style="color:#475569;line-height:1.6">
              Votre compte a ete cree avec succes sur LFD Web Learn,
              la plateforme de formation en ligne pour l'Afrique.
            </p>
            <div style="margin:24px 0;text-align:center">
              <a href="https://lfdweblearn.com/dashboard"
                style="background:#0284c7;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
                Acceder a mon espace
              </a>
            </div>
            <p style="color:#94a3b8;font-size:13px;margin-bottom:0">
              Si vous n'avez pas cree ce compte, ignorez cet email.
            </p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px">
            © 2024 LFD Web Learn — La faveur infinie de Dieu
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendWelcomeEmail error:', error)
  }
}

// ── Email confirmation achat formation ───────────────────────
export async function sendPurchaseConfirmationEmail(
  to: string,
  displayName: string,
  courseTitle: string,
  amount: number,
  currency: string
) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Confirmation de votre achat — ' + courseTitle,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#0284c7;font-size:28px;margin:0">
              LFD <span style="color:#f97316">Web Learn</span>
            </h1>
          </div>
          <div style="background:#f8fafc;border-radius:16px;padding:32px">
            <h2 style="color:#1e293b;margin-top:0">Paiement confirme ! ✅</h2>
            <p style="color:#475569;line-height:1.6">
              Bonjour <strong>${displayName}</strong>, votre achat a ete confirme avec succes.
            </p>
            <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0">
              <p style="margin:0 0 8px;color:#64748b;font-size:13px">Formation achetee</p>
              <p style="margin:0;font-weight:bold;color:#1e293b;font-size:16px">${courseTitle}</p>
              <p style="margin:8px 0 0;color:#0284c7;font-weight:bold;font-size:18px">
                ${amount.toLocaleString()} ${currency}
              </p>
            </div>
            <div style="margin:24px 0;text-align:center">
              <a href="https://lfdweblearn.com/dashboard"
                style="background:#0284c7;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
                Acceder a ma formation
              </a>
            </div>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px">
            © 2024 LFD Web Learn
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendPurchaseConfirmationEmail error:', error)
  }
}

// ── Email nouveau eleve pour le formateur ────────────────────
export async function sendNewStudentEmail(
  instructorEmail: string,
  instructorName: string,
  studentName: string,
  courseTitle: string,
  amount: number,
  currency: string
) {
  try {
    await resend.emails.send({
      from: FROM,
      to: instructorEmail,
      subject: 'Nouvel eleve inscrit — ' + courseTitle,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#0284c7;font-size:28px;margin:0">
              LFD <span style="color:#f97316">Web Learn</span>
            </h1>
          </div>
          <div style="background:#f8fafc;border-radius:16px;padding:32px">
            <h2 style="color:#1e293b;margin-top:0">Nouveau paiement recu ! 💰</h2>
            <p style="color:#475569;line-height:1.6">
              Bonjour <strong>${instructorName}</strong>, un nouvel eleve vient de s'inscrire a votre formation.
            </p>
            <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0">
              <div style="margin-bottom:12px">
                <p style="margin:0 0 4px;color:#64748b;font-size:13px">Eleve</p>
                <p style="margin:0;font-weight:bold;color:#1e293b">${studentName}</p>
              </div>
              <div style="margin-bottom:12px">
                <p style="margin:0 0 4px;color:#64748b;font-size:13px">Formation</p>
                <p style="margin:0;font-weight:bold;color:#1e293b">${courseTitle}</p>
              </div>
              <div>
                <p style="margin:0 0 4px;color:#64748b;font-size:13px">Montant</p>
                <p style="margin:0;font-weight:bold;color:#22c55e;font-size:18px">
                  +${amount.toLocaleString()} ${currency}
                </p>
              </div>
            </div>
            <div style="margin:24px 0;text-align:center">
              <a href="https://lfdweblearn.com/instructor/students"
                style="background:#0284c7;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
                Voir mes eleves
              </a>
            </div>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px">
            © 2024 LFD Web Learn
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendNewStudentEmail error:', error)
  }
}

// ── Email activation abonnement Pro ─────────────────────────
export async function sendSubscriptionEmail(
  to: string,
  displayName: string,
  planName: string,
  expiresAt: Date
) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Abonnement Pro active — LFD Web Learn',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#0284c7;font-size:28px;margin:0">
              LFD <span style="color:#f97316">Web Learn</span>
            </h1>
          </div>
          <div style="background:linear-gradient(135deg,#0284c7,#0369a1);border-radius:16px;padding:32px;color:white">
            <h2 style="margin-top:0">Abonnement Pro active ! 👑</h2>
            <p style="opacity:0.9;line-height:1.6">
              Bonjour <strong>${displayName}</strong>, votre abonnement <strong>${planName}</strong>
              est maintenant actif. Profitez de toutes les fonctionnalites Pro !
            </p>
            <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:16px;margin:20px 0">
              <p style="margin:0 0 4px;opacity:0.8;font-size:13px">Expire le</p>
              <p style="margin:0;font-weight:bold;font-size:16px">
                ${expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style="margin-top:24px;text-align:center">
              <a href="https://lfdweblearn.com/instructor"
                style="background:white;color:#0284c7;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
                Acceder a mon espace Pro
              </a>
            </div>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px">
            © 2024 LFD Web Learn
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendSubscriptionEmail error:', error)
  }
}