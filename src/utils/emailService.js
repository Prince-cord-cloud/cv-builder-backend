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
      // Generate unsubscribe URL (you'll implement this endpoint later)
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
      console.log(`📬 SendGrid Response: ${response[0].statusCode}`);
      return true;
      
    } catch (error) {
      if (error.response) {
        console.error('❌ SendGrid API Error:', {
          statusCode: error.response.statusCode,
          body: error.response.body,
          message: error.response.body?.errors?.[0]?.message || 'Unknown error'
        });
        
        if (error.response.body?.errors) {
          error.response.body.errors.forEach(err => {
            console.error(`   - ${err.message} (${err.field || 'N/A'})`);
          });
        }
      } else {
        console.error('❌ Email Error:', error.message);
      }
      return false;
    }
  }

  // Email 1: Congratulations on Signing Up
  async sendSignupCongratulations(user) {
    const subject = `Welcome to CV Builder, ${user.firstName}!`;
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Welcome to CV Builder</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px; width:100%; background:white; border-radius:16px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%); color:white; padding:40px 20px; border-radius:16px 16px 0 0;">
              <h1 style="margin:0 0 10px 0; font-size:32px;">Welcome to CV Builder!</h1>
              <p style="margin:0; opacity:0.9;">Your journey to a better career starts here</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="color:#1e88e5; margin:0 0 20px 0;">Hi ${user.firstName}!</h2>
              <p style="color:#333; line-height:1.6; margin:0 0 30px 0;">Thank you for joining CV Builder. We're excited to help you create professional, standout resumes that will impress employers.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa; padding:25px; border-radius:8px; margin:30px 0;">
                <tr>
                  <td style="padding:0 0 20px 0;">
                    <strong style="font-size:18px;">✨ Here's what you can do:</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 15px 0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align:top; font-size:20px;">📝</td>
                        <td style="padding-left:10px;">
                          <strong>Professional Templates</strong><br>
                          <span style="color:#666;">Choose from 20+ ATS-friendly designs</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 15px 0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align:top; font-size:20px;">🎨</td>
                        <td style="padding-left:10px;">
                          <strong>Easy Customization</strong><br>
                          <span style="color:#666;">Personalize colors, fonts, and layouts</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align:top; font-size:20px;">📄</td>
                        <td style="padding-left:10px;">
                          <strong>Export Options</strong><br>
                          <span style="color:#666;">Download as PDF or DOC, share online</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background:#1e88e5; border-radius:50px;">
                          <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block; padding:15px 35px; color:white; text-decoration:none; font-weight:600; font-size:16px;">Log In to Get Started</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 20px; color:#666; font-size:14px; border-top:1px solid #eee;">
              <p style="margin:0 0 10px 0;">© ${new Date().getFullYear()} CV Builder. All rights reserved.</p>
              <p style="margin:0; font-size:12px;">This email was sent to ${user.email} because you signed up for CV Builder.</p>
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

  // Email 2: First Login Welcome
  async sendFirstLoginWelcome(user) {
    const subject = `Welcome to CV Builder, ${user.firstName}!`;
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Get Started with CV Builder</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px; width:100%; background:white; border-radius:16px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%); color:white; padding:40px 20px; border-radius:16px 16px 0 0;">
              <h1 style="margin:0 0 10px 0; font-size:32px;">Welcome Aboard!</h1>
              <p style="margin:0; opacity:0.9;">Your first login was successful</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="color:#1e88e5; margin:0 0 20px 0;">Welcome, ${user.firstName}!</h2>
              <p style="color:#333; line-height:1.6; margin:0 0 30px 0;">You're now ready to create your professional CV. Here's how to get started:</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa; padding:25px; border-radius:8px; margin:30px 0;">
                <tr>
                  <td style="padding:0 0 20px 0;">
                    <strong style="font-size:18px;">🚀 Quick Start Guide:</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 15px 0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align:top; font-weight:bold;">1.</td>
                        <td style="padding-left:10px;">
                          <strong>Choose a Template</strong><br>
                          <span style="color:#666;">Browse our collection of professional, ATS-friendly templates</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 15px 0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align:top; font-weight:bold;">2.</td>
                        <td style="padding-left:10px;">
                          <strong>Add Your Information</strong><br>
                          <span style="color:#666;">Fill in your work experience, education, and skills</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 15px 0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align:top; font-weight:bold;">3.</td>
                        <td style="padding-left:10px;">
                          <strong>Customize & Preview</strong><br>
                          <span style="color:#666;">Adjust colors, fonts, and see real-time changes</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align:top; font-weight:bold;">4.</td>
                        <td style="padding-left:10px;">
                          <strong>Export & Apply</strong><br>
                          <span style="color:#666;">Download as PDF and start applying for jobs</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" style="margin:30px 0; background:#e3f2fd; padding:20px; border-radius:8px; border-left:4px solid #1e88e5;">
                <tr>
                  <td>
                    <strong>💡 Pro Tip:</strong> Start with one of our "Quick Build" templates. They're designed to be completed in under 15 minutes!
                  </td>
                </tr>
              </table>
              
              <table width="100%" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background:#1e88e5; border-radius:50px;">
                          <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block; padding:15px 35px; color:white; text-decoration:none; font-weight:600; font-size:16px;">Start Building Your CV</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="text-align:center; color:#666; font-size:14px;">Need help? Check out our tutorials or contact support.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 20px; color:#666; font-size:14px; border-top:1px solid #eee;">
              <p style="margin:0;">© ${new Date().getFullYear()} CV Builder. All rights reserved.</p>
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