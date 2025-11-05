/**
 * Email Service - Using Netlify Functions + Resend
 *
 * This service calls a Netlify Serverless Function that sends emails via Resend.
 * The API key is stored securely on the server, not exposed in the client.
 */

// Use Netlify Function URL (will be set after deployment)
// For local development, use: http://localhost:8888/.netlify/functions/send-login-code
const FUNCTION_URL = import.meta.env.PROD
  ? '/.netlify/functions/send-login-code'
  : 'http://localhost:8888/.netlify/functions/send-login-code';

interface SendLoginCodeResponse {
  success: boolean;
  messageId?: string;
}

export const sendCodeEmail = async (email: string, code: string): Promise<void> => {
  try {
    // Call Netlify Function via HTTP
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error('Failed to send email');
    }
  } catch (error: any) {
    console.error('Error sending email:', error);

    // Fallback: Show code in console for development only
    if (!import.meta.env.PROD) {
      console.log(`
╔═══════════════════════════════════════════════╗
║         TAXIS LOGIN CODE (FALLBACK)           ║
╠═══════════════════════════════════════════════╣
║  Email: ${email.padEnd(37)}║
║  Code:  ${code.padEnd(37)}║
║  Expires in: 5 minutes                        ║
╚═══════════════════════════════════════════════╝
      `);
    }

    // Don't throw error - allow login to continue with console code
  }
};


