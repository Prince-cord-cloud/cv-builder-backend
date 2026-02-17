const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    sgMail.setApiKey(this.apiKey);
    
    this.sender = {
      email: process.env.SENDGRID_SENDER_EMAIL,
      name: process.env.SENDGRID_SENDER_NAME || 'CV Builder App'
    };
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
      console.log(`📧 Email sent successfully to ${to.email}`);
      return true;
      
    } catch (error) {
      if (error.response) {
        console.error('❌ SendGrid API Error:', error.response.body);
      } else {
        console.error('❌ Email Error:', error.message);
      }
      return false;
    }
  }

  // SINGLE COMBINED EMAIL - Welcome & Congratulations Together
  async sendWelcomeEmail(user) {
    const subject = `🎉 Welcome to CV Builder, ${user.firstName}!`;
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Welcome to CV Builder</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f2f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Card -->
        <table width="100%" style="max-width: 560px; width:100%; background: #ffffff; border-radius: 24px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);">
          
          <!-- Header with Pattern -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); border-radius: 24px 24px 0 0;">
              <table width="100%">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin-bottom: 20px;">
                      <div style="width: 80px; height: 80px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;">📄</div>
                    </div>
                    <h1 style="color: #ffffff; font-size: 36px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">Welcome Aboard! 🎉</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0;">Your account is ready to go</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Hi ${user.firstName}! 👋</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thanks for joining CV Builder. We're excited to help you create a professional resume that stands out. Your account has been created and you're automatically logged in.
              </p>
            </td>
          </tr>
          
          <!-- Account Details Card (No Password) -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" style="background: #f8fafc; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0;">
                <tr>
                  <td>
                    <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">📋 Your Account Details</h3>
                    
                    <table width="100%">
                      <tr>
                        <td width="30" style="padding: 0 0 12px 0;">👤</td>
                        <td style="padding: 0 0 12px 0; color: #475569;"><strong style="color: #1e293b;">Name:</strong> ${user.firstName} ${user.lastName}</td>
                      </tr>
                      <tr>
                        <td width="30" style="padding: 0 0 12px 0;">📧</td>
                        <td style="padding: 0 0 12px 0; color: #475569;"><strong style="color: #1e293b;">Email:</strong> ${user.email}</td>
                      </tr>
                      ${user.phoneNumber ? `
                      <tr>
                        <td width="30" style="padding: 0 0 0px 0;">📱</td>
                        <td style="padding: 0 0 0px 0; color: #475569;"><strong style="color: #1e293b;">Phone:</strong> ${user.phoneNumber}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Features Grid -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">✨ What you can do now:</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Row 1 -->
                <tr>
                  <td width="50%" style="padding: 0 10px 20px 0;">
                    <table style="background: #f8fafc; border-radius: 16px; padding: 20px;">
                      <tr><td style="font-size: 32px; padding: 0 0 12px 0;">📝</td></tr>
                      <tr><td><strong style="color: #1e293b; font-size: 16px;">Professional Templates</strong></td></tr>
                      <tr><td><span style="color: #64748b; font-size: 14px;">20+ ATS-friendly designs</span></td></tr>
                    </table>
                  </td>
                  <td width="50%" style="padding: 0 0px 20px 10px;">
                    <table style="background: #f8fafc; border-radius: 16px; padding: 20px;">
                      <tr><td style="font-size: 32px; padding: 0 0 12px 0;">🎨</td></tr>
                      <tr><td><strong style="color: #1e293b; font-size: 16px;">Easy Customization</strong></td></tr>
                      <tr><td><span style="color: #64748b; font-size: 14px;">Personalize colors & fonts</span></td></tr>
                    </table>
                  </td>
                </tr>
                <!-- Row 2 -->
                <tr>
                  <td width="50%" style="padding: 0 10px 0 0;">
                    <table style="background: #f8fafc; border-radius: 16px; padding: 20px;">
                      <tr><td style="font-size: 32px; padding: 0 0 12px 0;">📄</td></tr>
                      <tr><td><strong style="color: #1e293b; font-size: 16px;">Export Options</strong></td></tr>
                      <tr><td><span style="color: #64748b; font-size: 14px;">PDF, DOC, share online</span></td></tr>
                    </table>
                  </td>
                  <td width="50%" style="padding: 0 0px 0 10px;">
                    <table style="background: #f8fafc; border-radius: 16px; padding: 20px;">
                      <tr><td style="font-size: 32px; padding: 0 0 12px 0;">⚡</td></tr>
                      <tr><td><strong style="color: #1e293b; font-size: 16px;">Real-time Preview</strong></td></tr>
                      <tr><td><span style="color: #64748b; font-size: 14px;">See changes instantly</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Quick Start Tip -->
          <tr>
            <td style="padding: 20px 40px 0 40px;">
              <table width="100%" style="background: #ecfdf5; border-radius: 16px; padding: 20px; border-left: 4px solid #10b981;">
                <tr>
                  <td width="30" style="font-size: 24px;">💡</td>
                  <td style="color: #065f46;">
                    <strong style="display: block; margin-bottom: 5px;">Quick Start Tip:</strong>
                    <span style="font-size: 14px;">Try our "Express CV" template - you can complete it in under 10 minutes!</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Dashboard Link (Not a Button) -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <table width="100%">
                <tr>
                  <td align="center">
                    <p style="color: #475569; font-size: 16px; margin: 0 0 8px 0;">👉 <strong style="color: #2563eb;">Your Dashboard:</strong></p>
                    <p style="color: #2563eb; font-size: 18px; word-break: break-all; margin: 0;">${process.env.FRONTEND_URL}/dashboard</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px 40px 40px; border-top: 1px solid #e2e8f0;">
              <table width="100%">
                <tr>
                  <td align="center" style="color: #94a3b8; font-size: 14px;">
                    <p style="margin: 0 0 12px 0;">© ${new Date().getFullYear()} CV Builder. All rights reserved.</p>
                    <p style="margin: 0; font-size: 13px;">
                      This email was sent to ${user.email}<br>
                      You received this because you created a CV Builder account.
                    </p>
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

module.exports = new EmailService();