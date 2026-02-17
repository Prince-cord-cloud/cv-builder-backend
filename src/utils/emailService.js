const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    // Initialize SendGrid with API key
    this.apiKey = process.env.SENDGRID_API_KEY;
    sgMail.setApiKey(this.apiKey);
    
    this.sender = {
      email: process.env.SENDGRID_SENDER_EMAIL,
      name: process.env.SENDGRID_SENDER_NAME || 'CV Builder App'
    };
  }

  async sendEmail(to, subject, htmlContent) {
    try {
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
        html: htmlContent,
        // Optional: Add tracking settings
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
      // Handle SendGrid specific errors
      if (error.response) {
        console.error('❌ SendGrid API Error:', {
          statusCode: error.response.statusCode,
          body: error.response.body,
          message: error.response.body?.errors?.[0]?.message || 'Unknown error'
        });
        
        // Log specific error details for debugging
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
    const subject = '🎉 Congratulations on Joining CV Builder!';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CV Builder</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f7;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
          }
          .content {
            background: white;
            padding: 40px 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
          }
          .greeting h2 {
            color: #1e88e5;
          }
          .feature-box {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .feature-item {
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          .feature-icon {
            font-size: 24px;
            margin-right: 15px;
            color: #1e88e5;
          }
          .button {
            display: inline-block;
            background: #1e88e5;
            color: white;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
          }
          .button:hover {
            background: #1565c0;
          }
          .footer {
            text-align: center;
            padding: 30px 20px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to CV Builder!</h1>
            <p>Your journey to a better career starts here</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <h2>Hi ${user.firstName}!</h2>
              <p>Thank you for joining CV Builder. We're excited to help you create professional, standout resumes that will impress employers.</p>
            </div>
            
            <div class="feature-box">
              <h3 style="margin-bottom: 20px;">✨ Here's what you can do:</h3>
              
              <div class="feature-item">
                <span class="feature-icon">📝</span>
                <div>
                  <strong>Professional Templates</strong>
                  <p style="color: #666;">Choose from 20+ ATS-friendly designs</p>
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">🎨</span>
                <div>
                  <strong>Easy Customization</strong>
                  <p style="color: #666;">Personalize colors, fonts, and layouts</p>
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">📄</span>
                <div>
                  <strong>Export Options</strong>
                  <p style="color: #666;">Download as PDF or DOC, share online</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center;">
              <p style="margin-bottom: 20px;"><strong>Next step:</strong> Log in to start building your CV</p>
              <a href="${process.env.FRONTEND_URL}/login" class="button">
                🔑 Log In Now
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} CV Builder. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              This email was sent to ${user.email} because you signed up for CV Builder.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      { 
        email: user.email, 
        name: `${user.firstName} ${user.lastName}` 
      },
      subject,
      htmlContent
    );
  }

  // Email 2: First Login Welcome
  async sendFirstLoginWelcome(user) {
    const subject = `👋 Welcome Aboard, ${user.firstName}!`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Get Started with CV Builder</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f7;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
          }
          .content {
            background: white;
            padding: 40px 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .greeting {
            text-align: center;
            margin-bottom: 30px;
          }
          .greeting h2 {
            color: #1e88e5;
            margin-bottom: 10px;
          }
          .step-box {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .step {
            margin-bottom: 20px;
            display: flex;
            align-items: flex-start;
          }
          .step-number {
            background: #1e88e5;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
          }
          .button {
            display: inline-block;
            background: #1e88e5;
            color: white;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
          }
          .button:hover {
            background: #1565c0;
          }
          .tip {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border-left: 4px solid #1e88e5;
          }
          .footer {
            text-align: center;
            padding: 30px 20px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👋 Let's Build Your CV!</h1>
            <p>Your first login was successful</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <h2>Welcome, ${user.firstName}! 🎉</h2>
              <p>You're now ready to create your professional CV. Here's how to get started:</p>
            </div>
            
            <div class="step-box">
              <h3 style="margin-bottom: 20px;">🚀 Quick Start Guide:</h3>
              
              <div class="step">
                <div class="step-number">1</div>
                <div>
                  <h4 style="margin-bottom: 5px;">Choose a Template</h4>
                  <p style="color: #666;">Browse our collection of professional, ATS-friendly templates</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div>
                  <h4 style="margin-bottom: 5px;">Add Your Information</h4>
                  <p style="color: #666;">Fill in your work experience, education, and skills</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">3</div>
                <div>
                  <h4 style="margin-bottom: 5px;">Customize & Preview</h4>
                  <p style="color: #666;">Adjust colors, fonts, and see real-time changes</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">4</div>
                <div>
                  <h4 style="margin-bottom: 5px;">Export & Apply</h4>
                  <p style="color: #666;">Download as PDF and start applying for jobs</p>
                </div>
              </div>
            </div>
            
            <div class="tip">
              <strong>💡 Pro Tip:</strong> Start with one of our "Quick Build" templates. They're designed to be completed in under 15 minutes!
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                🚀 Start Building Your CV
              </a>
            </div>
            
            <p style="text-align: center; margin-top: 20px; color: #666;">
              Need help? Check out our tutorials or contact support.
            </p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} CV Builder. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      { 
        email: user.email, 
        name: `${user.firstName} ${user.lastName}` 
      },
      subject,
      htmlContent
    );
  }
}

module.exports = new EmailService();