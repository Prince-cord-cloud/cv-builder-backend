class Logger {
  constructor() {
    this.startTime = Date.now();
  }

  // Get current timestamp
  timestamp() {
    return new Date().toISOString();
  }

  // Format log message
  format(level, message, data = null) {
    const logEntry = {
      timestamp: this.timestamp(),
      level,
      message,
      ...(data && { data })
    };
    return JSON.stringify(logEntry, null, 2);
  }

  // Server lifecycle
  server(message) {
    console.log(`[${this.timestamp()}] 🚀 SERVER: ${message}`);
  }

  // Database operations
  database(message, data = null) {
    const log = `[${this.timestamp()}] 📊 DATABASE: ${message}`;
    console.log(log);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  // Authentication events
  auth(message, userId = null, email = null, success = true) {
    const status = success ? '✅' : '❌';
    const userInfo = userId ? ` (User: ${userId}${email ? `, ${email}` : ''})` : '';
    console.log(`[${this.timestamp()}] ${status} AUTH: ${message}${userInfo}`);
  }

  // Email events
  email(message, recipient = null, success = true) {
    const status = success ? '📧' : '❌';
    const recipientInfo = recipient ? ` to ${recipient}` : '';
    console.log(`[${this.timestamp()}] ${status} EMAIL: ${message}${recipientInfo}`);
  }

  // Request logging
  request(req, userId = null) {
    const userInfo = userId ? ` (User: ${userId})` : '';
    console.log(`[${this.timestamp()}] 📨 ${req.method} ${req.url}${userInfo}`);
  }

  // Response logging
  response(method, url, statusCode, duration, userId = null) {
    const status = statusCode < 400 ? '✅' : '❌';
    const userInfo = userId ? ` (User: ${userId})` : '';
    console.log(`[${this.timestamp()}] ${status} RESPONSE: ${method} ${url} - ${statusCode} - ${duration}ms${userInfo}`);
  }

  // Error logging
  error(message, error = null, userId = null) {
    const userInfo = userId ? ` (User: ${userId})` : '';
    console.error(`[${this.timestamp()}] ❌ ERROR: ${message}${userInfo}`);
    if (error) {
      if (error.stack) console.error(error.stack);
      else console.error(error);
    }
  }

  // Success logging
  success(message, userId = null) {
    const userInfo = userId ? ` (User: ${userId})` : '';
    console.log(`[${this.timestamp()}] ✅ SUCCESS: ${message}${userInfo}`);
  }

  // Warning logging
  warn(message, userId = null) {
    const userInfo = userId ? ` (User: ${userId})` : '';
    console.warn(`[${this.timestamp()}] ⚠️ WARNING: ${message}${userInfo}`);
  }

  // User activity
  activity(action, userId, email, details = null) {
    console.log(`[${this.timestamp()}] 👤 ACTIVITY: ${action} - User: ${userId} (${email})`);
    if (details) console.log(JSON.stringify(details, null, 2));
  }

  // Email details
  emailDetails(to, subject, success, response = null, error = null) {
    const status = success ? '✅' : '❌';
    console.log(`[${this.timestamp()}] ${status} EMAIL DETAILS:`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    if (success && response) {
      console.log(`   Response: ${JSON.stringify(response)}`);
    }
    if (!success && error) {
      console.log(`   Error: ${error}`);
    }
  }
}

module.exports = new Logger();