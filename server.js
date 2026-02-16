const app = require('./src/app');
const axios = require('axios');

const PORT = process.env.PORT || 5000;

// Function to check Brevo connection
const checkBrevoConnection = async () => {
  try {
    const response = await axios.get('https://api.brevo.com/v3/account', {
      headers: {
        'api-key': process.env.BREVO_API_KEY
      }
    });
    
    if (response.status === 200) {
      console.log(`✅ Brevo email service connected`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Brevo connection failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const server = app.listen(PORT, async () => {
  console.log(`🚀 CV Builder backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  
  // Check Brevo connection
  await checkBrevoConnection();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`👋 SIGTERM received, shutting down gracefully...`);
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(`👋 SIGINT received, shutting down gracefully...`);
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