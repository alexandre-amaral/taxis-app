import * as functions from "firebase-functions";
import {Resend} from "resend";
import * as cors from "cors";

// Initialize CORS
const corsHandler = cors({origin: true});

// Initialize Resend
const resend = new Resend(functions.config().resend?.key || "re_bD3Swbhq_KeftjLNcEUddiCiXct4cfjzs");

interface SendLoginCodeData {
  email: string;
  code: string;
}

/**
 * Firebase HTTP Function to send login code via email with CORS support
 */
export const sendLoginCode = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      const {email, code} = req.body.data as SendLoginCodeData;

      // Validate input
      if (!email || !code) {
        res.status(400).json({
          error: {
            message: "Email and code are required",
            status: "INVALID_ARGUMENT",
          },
        });
        return;
      }

      // Send email using Resend
      const result = await resend.emails.send({
        from: "Taxis <onboarding@resend.dev>",
        to: [email],
        subject: "Taxis - Your Login Code",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 20px; background-color: #0a0a0a;">
              <div style="max-width: 600px; margin: 0 auto;
                background: linear-gradient(135deg, #1a1a1a 0%, #0d1117 100%);
                border-radius: 12px; border: 1px solid rgba(0, 255, 255, 0.2);
                padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #00ffff; font-size: 36px; margin: 0;">
                    Taxis
                  </h1>
                  <p style="color: #9ca3af; font-size: 14px; margin-top: 8px;">
                    Your Personal Intelligence Analyst
                  </p>
                </div>
                <div style="background: rgba(0, 255, 255, 0.05);
                  border: 1px solid rgba(0, 255, 255, 0.15);
                  border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                  <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px 0;">
                    Your Login Code
                  </h2>
                  <p style="color: #d1d5db; font-size: 14px; margin: 0 0 20px 0;">
                    Use this code to sign in to your Taxis account:
                  </p>
                  <div style="background: #0a0a0a;
                    border: 2px solid rgba(0, 255, 255, 0.4);
                    border-radius: 8px; padding: 24px; text-align: center;">
                    <div style="color: #00ffff; font-size: 42px;
                      font-weight: bold; letter-spacing: 12px;">
                      ${code}
                    </div>
                  </div>
                  <p style="color: #9ca3af; font-size: 12px;
                    margin: 16px 0 0 0; text-align: center;">
                    This code will expire in 5 minutes
                  </p>
                </div>
                <div style="text-align: center; padding-top: 20px;
                  border-top: 1px solid rgba(0, 255, 255, 0.1);">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    If you didn't request this code, please ignore this email.
                  </p>
                  <p style="color: #4b5563; font-size: 11px; margin: 8px 0 0 0;">
                    This is an automated message, please do not reply.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log("✅ Email sent successfully:", result);

      res.status(200).json({
        data: {
          success: true,
          messageId: result.data?.id,
        },
      });
    } catch (error) {
      console.error("❌ Error sending email:", error);
      res.status(500).json({
        error: {
          message: "Failed to send email",
          status: "INTERNAL",
        },
      });
    }
  });
});
