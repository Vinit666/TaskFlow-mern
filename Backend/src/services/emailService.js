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
    const subject = `Welcome to TaskFlow, ${user.name}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TaskFlow</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f8;
            color: #334155;
            margin: 0;
            padding: 32px 16px;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px 36px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          }
          .logo {
            font-size: 22px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 28px;
            letter-spacing: -0.5px;
          }
          .heading {
            font-size: 20px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 16px;
            line-height: 1.4;
          }
          .text {
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
            margin-bottom: 20px;
          }
          .info-box {
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 16px 20px;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #4f46e5;
            margin-bottom: 24px;
          }
          .info-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            margin: 0;
          }
          .footer {
            margin-top: 36px;
            font-size: 12px;
            color: #94a3b8;
            text-align: left;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="logo">TaskFlow</div>
          <div class="heading">Welcome aboard, ${user.name}</div>
          <p class="text">
            Your TaskFlow account has been successfully created. You can now organize your workflows, track real-time task statuses, set priorities, and monitor productivity analytics directly from your dashboard.
          </p>
          <div class="info-box">
            <div class="info-label">Registered Account</div>
            <p class="info-value">${user.email}</p>
          </div>
          <p class="text">
            If you have any questions or need assistance getting started, please reach out to our support team.
          </p>
          <div class="footer">
            This is an automated transactional notification sent to ${user.email}.<br>
            &copy; ${new Date().getFullYear()} TaskFlow. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      toEmail: user.email,
      toName: user.name,
      subject,
      htmlContent,
      textContent: `Welcome to TaskFlow, ${user.name}. Your account (${user.email}) has been successfully created.`
    });
  }

  /**
   * Sends a styled Password Reset OTP Email
   * @param {Object} user - User document { name, email }
   * @param {string} otp - 6-digit verification code
   */
  static async sendPasswordResetOtpEmail(user, otp) {
    const subject = `Your TaskFlow Password Reset OTP: ${otp}`;
    const formattedOtp = otp.split('').join(' ');
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f8;
            color: #334155;
            margin: 0;
            padding: 32px 16px;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px 36px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          }
          .logo {
            font-size: 22px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 28px;
            letter-spacing: -0.5px;
          }
          .heading {
            font-size: 20px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 16px;
            line-height: 1.4;
          }
          .text {
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
            margin-bottom: 24px;
          }
          .otp-card {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            border: 1px solid #e2e8f0;
            margin-bottom: 24px;
          }
          .otp-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .otp-code {
            font-size: 34px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: 8px;
            font-family: 'Courier New', Courier, monospace;
            margin: 6px 0;
          }
          .expiry-badge {
            display: inline-block;
            background-color: #eef2ff;
            color: #4338ca;
            border: 1px solid #c7d2fe;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 10px;
          }
          .notice {
            font-size: 13px;
            line-height: 1.5;
            color: #64748b;
            background-color: #f8fafc;
            padding: 14px 16px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            border-left: 3px solid #94a3b8;
            margin-bottom: 24px;
          }
          .footer {
            margin-top: 36px;
            font-size: 12px;
            color: #94a3b8;
            text-align: left;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="logo">TaskFlow</div>
          <div class="heading">Password Reset Verification</div>
          <p class="text">
            Hello ${user.name || 'there'}, we received a request to reset your password. Use the verification code below to verify your identity and set a new password.
          </p>
          <div class="otp-card">
            <div class="otp-label">One-Time Password</div>
            <div class="otp-code">${formattedOtp}</div>
            <div class="expiry-badge">Valid for 10 minutes</div>
          </div>
          <div class="notice">
            <strong>Security Notice:</strong> If you did not initiate this request, someone may have entered your email address by mistake. Your account is secure, and no changes will be made without this verification code.
          </div>
          <div class="footer">
            This is an automated security verification email sent to ${user.email}.<br>
            &copy; ${new Date().getFullYear()} TaskFlow Authentication. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      toEmail: user.email,
      toName: user.name || '',
      subject,
      htmlContent,
      textContent: `Your TaskFlow password reset verification code is: ${otp}. It will expire in 10 minutes.`
    });
  }
}

module.exports = EmailService;
