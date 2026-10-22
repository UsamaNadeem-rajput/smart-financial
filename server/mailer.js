const nodemailer = require('nodemailer');

// OrangeHost SMTP Transporter
const transporter = nodemailer.createTransport({
  host: "mail.khushifinances.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@khushifinances.com",
    pass: "Usamark@123"
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Generate 6-digit numeric verification code
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send Verification Email with highlighted OTP code, instructions, and security guidelines
 */
async function sendVerificationEmail({ to, name, code }) {
  const recipientName = name || 'there';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code - Smart Financial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0E1A14; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F2F5EE; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border: 2px solid #0E1A14; border-radius: 12px; overflow: hidden; box-shadow: 4px 4px 0px #0E1A14;">
          
          <!-- Brand Header Banner -->
          <tr>
            <td style="background-color: #0E1A14; padding: 32px 36px; text-align: left; border-bottom: 4px solid #C8F135;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #C8F135; color: #0E1A14; font-weight: 900; font-size: 12px; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 10px;">
                      Smart Financial
                    </div>
                    <h1 style="margin: 0; color: #F2F5EE; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.25;">
                      Verify Your Email Address
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <p style="margin: 0 0 16px; font-size: 17px; line-height: 1.5; color: #0E1A14;">
                Hi <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #44544B;">
                Welcome to <strong>Smart Financial</strong>! You're almost ready to start organizing your business books, ledgers, and accounts. Please use the 6-digit verification code below to verify your email address:
              </p>

              <!-- Highlighted Code Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #0E1A14; border: 2px solid #0E1A14; border-radius: 10px; padding: 24px 30px; text-align: center; box-shadow: 4px 4px 0px #C8F135;">
                      <div style="color: #A4B89D; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                        One-Time Verification Code
                      </div>
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #C8F135; text-indent: 12px; line-height: 1.2;">
                        ${code}
                      </div>
                      <div style="display: inline-block; background-color: #1F3025; color: #C8F135; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; margin-top: 12px; border: 1px solid #2C3F34;">
                        ⏱ Valid for 15 minutes
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info & Guidance Box -->
              <div style="background-color: #F8FAF6; border: 1px solid #D2DDD4; border-left: 4px solid #0E1A14; border-radius: 6px; padding: 18px 20px; margin: 26px 0;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #0E1A14; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Important Details:
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.6; color: #44544B;">
                  <li style="margin-bottom: 6px;">
                    <strong>Next Step:</strong> Switch back to your browser window and enter this code to complete verification.
                  </li>
                  <li style="margin-bottom: 6px;">
                    <strong>Security Notice:</strong> Smart Financial will never ask you to share your verification code or password.
                  </li>
                  <li>
                    <strong>Expiry:</strong> For safety reasons, this code expires in 15 minutes. You can request a new code from the verification screen if needed.
                  </li>
                </ul>
              </div>

              <!-- Security Disclaimer -->
              <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.5; color: #7B8F82; border-top: 1px solid #E4EBDC; padding-top: 18px;">
                <strong>Did not create an account?</strong> If you did not make this request, you can safely ignore this email. No account will be activated without code verification.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F2F5EE; padding: 22px 36px; text-align: center; border-top: 2px solid #0E1A14;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #0E1A14;">
                Smart Financials by Khushi Vijay
              </p>
              <p style="margin: 0; font-size: 12px; color: #64756B;">
                Ledger Vaults &bull; Double-Entry Accounting &bull; Financial Reports
              </p>
              <p style="margin: 6px 0 0; font-size: 12px; color: #64756B;">
                Need help? <a href="mailto:support@khushifinances.com" style="color: #0E1A14; font-weight: 600; text-decoration: underline;">support@khushifinances.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `=========================================
SMART FINANCIAL - EMAIL VERIFICATION
=========================================

Hi ${recipientName},

Thank you for registering with Smart Financial.
To verify your email address and activate your account, please enter the following verification code:

-----------------------------------------
YOUR VERIFICATION CODE:  ${code}
-----------------------------------------
(Valid for 15 minutes)

IMPORTANT DETAILS:
• Return to your browser and enter this 6-digit code.
• This code will expire in 15 minutes.
• Never share this code with anyone. Smart Financial will never ask for your code.

If you did not create an account with Smart Financial, you can safely ignore this email.

Need help? Contact support@khushifinances.com
Smart Financials by Khushi Vijay`;

  try {
    const info = await transporter.sendMail({
      from: '"Khushi Finances" <support@khushifinances.com>',
      to,
      subject: `Verify your Smart Financial account — Code: ${code}`,
      text,
      html
    });
    console.log('✅ Verification email sent to:', to, info?.messageId);
    return info;
  } catch (err) {
    console.error('❌ Verification email send error for', to, ':', err.message);
    throw err;
  }
}

/**
 * Send Password Reset Email with highlighted code
 */
async function sendResetEmail({ to, username, code }) {
  const recipient = username || 'there';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code - Smart Financial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0E1A14;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F2F5EE; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border: 2px solid #0E1A14; border-radius: 12px; overflow: hidden; box-shadow: 4px 4px 0px #0E1A14;">
          <tr>
            <td style="background-color: #0E1A14; padding: 32px 36px; text-align: left; border-bottom: 4px solid #C8F135;">
              <div style="display: inline-block; background-color: #C8F135; color: #0E1A14; font-weight: 900; font-size: 12px; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 10px;">
                Smart Financial
              </div>
              <h1 style="margin: 0; color: #F2F5EE; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Password Reset Request
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px;">
              <p style="margin: 0 0 16px; font-size: 17px; line-height: 1.5; color: #0E1A14;">
                Hi <strong>${recipient}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #44544B;">
                We received a request to reset your password for your Smart Financial account. Use the one-time code below to proceed:
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #0E1A14; border: 2px solid #0E1A14; border-radius: 10px; padding: 24px 30px; text-align: center; box-shadow: 4px 4px 0px #C8F135;">
                      <div style="color: #A4B89D; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                        Password Reset Code
                      </div>
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #C8F135; text-indent: 12px; line-height: 1.2;">
                        ${code}
                      </div>
                      <div style="display: inline-block; background-color: #1F3025; color: #C8F135; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; margin-top: 12px;">
                        ⏱ Valid for 15 minutes
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="background-color: #F8FAF6; border: 1px solid #D2DDD4; border-left: 4px solid #0E1A14; border-radius: 6px; padding: 18px 20px; margin: 26px 0;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #0E1A14;">SECURITY NOTICE:</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #44544B;">
                  If you did not request a password reset, please ignore this email or review your account security immediately. Your current password remains unchanged.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F2F5EE; padding: 22px 36px; text-align: center; border-top: 2px solid #0E1A14;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #0E1A14;">
                Smart Financials by Khushi Vijay
              </p>
              <p style="margin: 0; font-size: 12px; color: #64756B;">
                Support: <a href="mailto:support@khushifinances.com" style="color: #0E1A14; font-weight: 600;">support@khushifinances.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `=========================================
SMART FINANCIAL - PASSWORD RESET
=========================================

Hi ${recipient},

We received a request to reset your password.
Your reset code is:

-----------------------------------------
YOUR RESET CODE:  ${code}
-----------------------------------------
(Valid for 15 minutes)

If you did not request this, you can safely ignore this email.
Need help? Contact support@khushifinances.com`;

  try {
    const info = await transporter.sendMail({
      from: '"Khushi Finances" <support@khushifinances.com>',
      to,
      subject: `Password Reset Code: ${code} - Smart Financial`,
      text,
      html
    });
    console.log('✅ Reset email sent to:', to, info?.messageId);
    return info;
  } catch (err) {
    console.error('❌ Reset email send error for', to, ':', err.message);
    throw err;
  }
}

module.exports = {
  transporter,
  generateCode,
  sendVerificationEmail,
  sendResetEmail
};
