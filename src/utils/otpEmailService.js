const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

class OtpEmailService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    sgMail.setApiKey(this.apiKey);
    
    this.sender = {
      email: process.env.SENDGRID_SENDER_EMAIL,
      name: process.env.SENDGRID_SENDER_NAME || 'CV Builder App'
    };
    
    logger.server('OTP email service initialized');
  }

  // Helper to create plain text version
  createPlainText(html) {
    return html.replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  async sendEmail(to, subject, htmlContent) {
    try {
      const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(to.email)}`;
      
      const msg = {
        to: {
          email: to.email,
          name: to.name
        },
        from: {
          email: this.sender.email,
          name: this.sender.name
        },
        subject: subject,
        text: this.createPlainText(htmlContent),
        html: htmlContent,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      const response = await sgMail.send(msg);
      logger.email(`OTP email sent to ${to.email}`, to.email, true);
      return true;
      
    } catch (error) {
      logger.email(`Failed to send OTP email to ${to.email}`, to.email, false);
      if (error.response) {
        console.error('❌ SendGrid Error:', error.response.body);
      }
      return false;
    }
  }

  // Send OTP via Email
  async sendOtpEmail(user, otp) {
    const subject = `🔐 Your CV Builder Password Reset OTP`;
    
    // SPAM WARNING
    const spamWarning = `
      <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 0; font-weight: 600;">⚠️ Important: Check Your Spam Folder!</p>
        <p style="margin: 10px 0 0 0; font-size: 14px;">
          This email might land in your <strong>Spam/Junk folder</strong>. 
          If you don't see it in your inbox within 2 minutes, please check spam.
        </p>
      </div>
    `;
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Your Password Reset OTP</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fc;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7fc;">
    <tr>
      <td align="center" style="padding: 30px 20px;">
        <!-- Main Container -->
        <table width="100%" style="max-width: 560px; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; border-radius: 20px 20px 0 0; text-align: center;">
              <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px;">
                <div style="width: 80px; height: 80px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;">🔐</div>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Password Reset OTP</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${user.firstName}, here's your one-time password</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              ${spamWarning}
              
              <h2 style="color: #1e293b; font-size: 22px; margin: 0 0 10px 0;">Hello ${user.firstName}!</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You requested to reset your password. Use the OTP below to complete the process.
              </p>
              
              <!-- OTP Display - Large and Clear -->
              <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border: 2px dashed #2563eb; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="color: #1e40af; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
                <div style="font-size: 48px; font-weight: 700; color: #1e40af; letter-spacing: 8px; font-family: monospace;">${otp}</div>
                <p style="color: #475569; font-size: 14px; margin: 15px 0 0 0;">⏰ Expires in 5 minutes</p>
              </div>
              
              <!-- Timer Info -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="color: #475569; margin: 0;">
                  <i class="fas fa-clock" style="color: #2563eb;"></i> 
                  This OTP will expire on <strong>${new Date(Date.now() + 5*60000).toLocaleTimeString()}</strong>
                </p>
              </div>
              
              <!-- Instructions -->
              <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #334155; margin: 0 0 10px 0; font-weight: 600;">📋 Next Steps:</p>
                <ol style="color: #475569; margin: 0 0 0 20px;">
                  <li>Enter the 6-digit OTP above on the reset page</li>
                  <li>Choose your new password</li>
                  <li>Login with your new password</li>
                </ol>
              </div>
              
              <!-- Security Notice -->
              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 8px;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  <strong>⚠️ Never share this OTP:</strong> Our team will never ask for your OTP or password.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer with Spam Instructions -->
          <tr>
            <td style="padding: 30px; background: #f8fafc; border-radius: 0 0 20px 20px;">
              <table width="100%">
                <tr>
                  <td align="center" style="color: #64748b; font-size: 13px;">
                    <p style="margin: 0 0 10px 0;"><strong>📌 Didn't receive this email?</strong></p>
                    <p style="margin: 0 0 5px 0;">✓ Check your <strong style="color: #2563eb;">Spam/Junk folder</strong></p>
                    <p style="margin: 0 0 5px 0;">✓ Mark as "Not Spam" to help future emails</p>
                    <p style="margin: 0 0 15px 0;">✓ Add <strong>${this.sender.email}</strong> to contacts</p>
                    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} CV Builder. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return await this.sendEmail(
      { email: user.email, name: `${user.firstName} ${user.lastName}` },
      subject,
      htmlContent
    );
  }
}

module.exports = new OtpEmailService();