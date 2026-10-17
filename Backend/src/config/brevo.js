/**
 * Brevo (formerly Sendinblue) Configuration
 * Reads configuration from environment variables with safe defaults.
 */

const brevoConfig = {
  apiKey: process.env.BREVO_API_KEY || '',
  senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@taskflow.com',
  senderName: process.env.BREVO_SENDER_NAME || 'TaskFlow',
  apiEndpoint: 'https://api.brevo.com/v3/smtp/email',

  // Checks whether the user has provided a real API key instead of the placeholder
  isConfigured: () => {
    const key = process.env.BREVO_API_KEY;
    return Boolean(key && key.trim() !== '' && !key.includes('your_brevo_api_key'));
  }
};

module.exports = brevoConfig;
