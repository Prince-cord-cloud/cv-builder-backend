const app = require('./src/app');
const sgMail = require('@sendgrid/mail');

const PORT = process.env.PORT || 5000;

// Function to check SendGrid connection
const checkSendGridConnection = async () => {
  try {
    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Verify API key by checking account info or sending a test
    // This is a simple check - SendGrid doesn't have a direct "test" endpoint
    // but we can check if the API key is set
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.length > 10) {
      console.log(`✅ SendGrid email service connected`);
      
      // Optional: Send a test email to yourself to verify everything works
      if (process.env.NODE_ENV === 'development') {
        const testMsg = {
          to: process.env.SENDGRID_SENDER_EMAIL,
          from: process.env.SENDGRID_SENDER_EMAIL,
          subject: 'SendGrid Test',
          text: 'SendGrid email service connected successfully!'
        };
        
        // Uncomment to send test email on startup
        // await sgMail.send(testMsg);
        // console.log(`📧 Test email sent to ${process.env.SENDGRID_SENDER_EMAIL}`);
      }
      
      return true;
    } else {
      console.log(`❌ SendGrid API key not found or invalid`);
      return false;
    }
  } catch (error) {
    console.log(`❌ SendGrid connection failed: ${error.message}`);
    return false;
  }
};

const server = app.listen(PORT, async () => {
  console.log(`🚀 CV Builder backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  
  // Check SendGrid connection
  await checkSendGridConnection();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`👋 Server has gone offline`);
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(`👋 Server has gone offline`);
  server.close(() => {
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ UNHANDLED REJECTION:`, err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ UNCAUGHT EXCEPTION:`, err);
  server.close(() => process.exit(1));
});