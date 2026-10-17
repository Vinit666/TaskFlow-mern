const brevoConfig = require('../config/brevo');
const logger = require('../utils/logger');

/**
 * Brevo Email Service
 * Handles transactional emails with real Brevo API integration and graceful fallback.
 */
class EmailService {
  /**
   * Helper to send an email via Brevo REST API
   * @param {Object} options - { toEmail, toName, subject, htmlContent, textContent }
   */
  static async sendEmail({ toEmail, toName = '', subject, htmlContent, textContent = '' }) {
    if (!brevoConfig.isConfigured()) {
      logger.info(
        `[Brevo Email Simulation] Email to <${toEmail}> | Subject: "${subject}"`
      );
      logger.debug(
        `[Brevo Note] Set real BREVO_API_KEY and verified BREVO_SENDER_EMAIL in .env to send actual emails.`
      );
      return { simulated: true, success: true, to: toEmail };
    }

    try {
      const payload = {
        sender: {
          name: brevoConfig.senderName,
          email: brevoConfig.senderEmail
        },
        to: [
          {
            email: toEmail,
            name: toName || toEmail
          }
        ],
        subject,
        htmlContent,
        textContent: textContent || subject
      };

      const response = await fetch(brevoConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoConfig.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(`[Brevo API Error] Status: ${response.status}`, errorData);
        return { success: false, error: errorData };
      }

      const data = await response.json();
      logger.success(`[Brevo Email Sent] MessageId: ${data.messageId} to <${toEmail}>`);
      return { success: true, messageId: data.messageId };
    } catch (err) {
      logger.error(`[Brevo Dispatch Error] Failed to send email to <${toEmail}>:`, err.message);
      // Non-blocking: Do not crash application if external email fails
      return { success: false, error: err.message };
    }
  }

  /**
   * Sends a styled Welcome Email to newly registered users
   * @param {Object} user - User document { name, email }
   */
  static async sendWelcomeEmail(user) {
    const subject = `Welcome to TaskFlow, ${user.name}! 🚀`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
          .logo { font-size: 24px; font-weight: 700; color: #6366f1; margin-bottom: 24px; letter-spacing: -0.5px; }
          .heading { font-size: 20px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px; }
          .text { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
          .card { background: #0f172a; border-radius: 8px; padding: 16px 20px; border-left: 4px solid #6366f1; margin-bottom: 24px; }
          .card-title { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px; }
          .card-text { font-size: 13px; color: #64748b; margin: 0; }
          .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚡ TaskFlow</div>
          <div class="heading">Hello ${user.name}, welcome aboard!</div>
          <p class="text">
            Your account has been successfully created. You can now organize your workflows,
            track real-time statuses (Pending, In-Progress, Completed), prioritize high-impact goals,
            and monitor your productivity analytics right from your dashboard.
          </p>
          <div class="card">
            <div class="card-title">Registered Account</div>
            <p class="card-text">Email: <strong>${user.email}</strong></p>
          </div>
          <p class="text">
            If you have any questions or need assistance, feel free to reach out to our team.
          </p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} TaskFlow. Built with modern MERN Architecture.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      toEmail: user.email,
      toName: user.name,
      subject,
      htmlContent
    });
  }
}

module.exports = EmailService;
