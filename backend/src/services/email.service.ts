



import { Resend } from 'resend';

const RESEND_API_KEY = process.env['RESEND_API_KEY'];
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const FROM_EMAIL = process.env['EMAIL_FROM'] || 'CrediCheck <noreply@resend.dev>';
const APP_URL = process.env['APP_URL'] || 'https://frondend-credicheck.onrender.com';

export class EmailService {
  /**
   * Envía email de restablecimiento de contraseña
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    if (!resend) {
      console.warn('Resend not configured, skipping email send');
      return;
    }

    const resetLink = `${APP_URL}/forgot-password?token=${resetToken}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Restablecer tu contraseña - CrediCheck',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f1f35 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">CrediCheck</h1>
            <p style="color: #94a3b8; margin: 10px 0 0;">Restablecer Contraseña</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 20px;">Hola,</p>
            
            <p style="margin: 0 0 20px;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en CrediCheck.
              Si no solicitaste este cambio, puedes ignorar este email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: #1e3a5f; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Restablecer Contraseña
              </a>
            </div>
            
            <p style="margin: 0 0 20px; font-size: 14px; color: #64748b;">
              Este enlace expira en <strong>1 hora</strong>.
            </p>
            
            <p style="margin: 0 0 20px; font-size: 14px; color: #64748b;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:
            </p>
            
            <p style="margin: 0; font-size: 12px; color: #94a3b8; word-break: break-all;">
              ${resetLink}
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Este es un email automático de CrediCheck. No respondas a este mensaje.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error('Error al enviar el email de restablecimiento');
    }
  }

  /**
   * Envía email de bienvenida cuando un usuario es creado
   */
  static async sendWelcomeEmail(
    email: string,
    name: string,
    temporaryPassword: string
  ): Promise<void> {
    if (!resend) {
      console.warn('Resend not configured, skipping welcome email send');
      return;
    }
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Bienvenido a CrediCheck',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f1f35 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">CrediCheck</h1>
            <p style="color: #94a3b8; margin: 10px 0 0;">Tu cuenta ha sido creada</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 20px;">Hola <strong>${name}</strong>,</p>
            
            <p style="margin: 0 0 20px;">
              Tu cuenta en CrediCheck ha sido creada exitosamente.
            </p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px; font-size: 14px;"><strong>Credenciales de acceso:</strong></p>
              <p style="margin: 0; font-size: 14px;">Email: <strong>${email}</strong></p>
              <p style="margin: 5px 0 0; font-size: 14px;">Contraseña temporal: <strong>${temporaryPassword}</strong></p>
            </div>
            
            <p style="margin: 0 0 20px;">
              Por seguridad, te recomendamos cambiar tu contraseña temporal después de iniciar sesión.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Error al enviar el email de bienvenida');
    }
  }
}
