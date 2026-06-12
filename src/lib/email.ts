import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'miUTP <noreply@miutp.sditecnologia.cl>'

export async function sendInvitacionEmail(
  to: string,
  colegioNombre: string,
  invitadoPorNombre: string,
  invitationLink: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${invitadoPorNombre} te invita a unirte a ${colegioNombre} en miUTP`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:48px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#0f1117;border:1px solid #1e2536;border-radius:16px;overflow:hidden">

        <!-- Header gradient bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#7c3aed,#4f46e5)"></td></tr>

        <!-- Logo + title -->
        <tr><td style="padding:36px 40px 0">
          <p style="margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#f1f5f9">miUTP</p>
          <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:2px">Plataforma pedagógica</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9">Tienes una invitación</p>
          <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6">
            <strong style="color:#c4b5fd">${invitadoPorNombre}</strong> te ha invitado a unirte a
            <strong style="color:#c4b5fd">${colegioNombre}</strong> como profesor en miUTP.
          </p>
          <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6">
            Haz clic en el botón para aceptar la invitación. Este link es válido por <strong style="color:#94a3b8">48 horas</strong>.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto">
            <tr><td style="border-radius:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5)">
              <a href="${invitationLink}"
                 style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px">
                Unirme a ${colegioNombre}
              </a>
            </td></tr>
          </table>

          <p style="margin:32px 0 0;font-size:11px;color:#475569;line-height:1.5">
            Si no reconoces este correo, puedes ignorarlo sin problemas. El link expirará automáticamente.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1e2536">
          <p style="margin:0;font-size:11px;color:#334155;text-align:center">
            miUTP &copy; ${new Date().getFullYear()} &mdash; Automatización SIMCE
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
