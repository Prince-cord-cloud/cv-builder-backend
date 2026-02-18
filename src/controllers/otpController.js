const User = require('../models/User');
const crypto = require('crypto');
const logger = require('../utils/logger');
const otpEmailService = require('../utils/otpEmailService');
const { generateToken } = require('./authController');

// @desc    Request OTP for password reset
// @route   POST /api/auth/request-otp
// @access  Public
exports.requestOtp = async (req, res) => {
  const startTime = Date.now();
  const { email } = req.body;
  
  logger.request(req);
  logger.auth(`OTP requested`, null, email);

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select(
      '+otpRequestCount +otpRequestWindowStart +otpBlockedUntil'
    );
    
    // Always return success even if user doesn't exist (security)
    if (!user) {
      logger.warn(`OTP requested for non-existent email`, null, email);
      
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive an OTP.'
      });
    }

    // ========== RATE LIMITING IMPLEMENTATION ==========
    const now = new Date();
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
    const MAX_REQUESTS_PER_HOUR = 3; // Maximum 3 OTP requests per hour

    // Check if user is currently blocked
    if (user.otpBlockedUntil && user.otpBlockedUntil > now) {
      const minutesLeft = Math.ceil((user.otpBlockedUntil - now) / (60 * 1000));
      
      logger.warn(`OTP request blocked - too many attempts`, user._id, email);
      
      return res.status(429).json({
        success: false,
        error: `Too many OTP requests. Please try again in ${minutesLeft} minutes.`
      });
    }

    // Reset counter if window has expired
    if (user.otpRequestWindowStart && (now - user.otpRequestWindowStart) > ONE_HOUR) {
      user.otpRequestCount = 0;
      user.otpRequestWindowStart = null;
      user.otpBlockedUntil = null;
    }

    // Check if user has exceeded max requests in current window
    if (user.otpRequestCount >= MAX_REQUESTS_PER_HOUR) {
      // Block user for 1 hour
      user.otpBlockedUntil = new Date(now.getTime() + ONE_HOUR);
      await user.save();
      
      logger.warn(`OTP request limit exceeded - user blocked for 1 hour`, user._id, email);
      
      return res.status(429).json({
        success: false,
        error: 'Too many OTP requests. Please try again in 1 hour.'
      });
    }

    // Increment request count
    user.otpRequestCount += 1;
    
    // Set window start if this is first request in new window
    if (!user.otpRequestWindowStart) {
      user.otpRequestWindowStart = now;
    }
    
    // Save rate limit updates before generating OTP
    await user.save();
    // ========== END RATE LIMITING ==========

    // Generate OTP (6-digit)
    const otp = user.generateOtp();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    const emailSent = await otpEmailService.sendOtpEmail(user, otp);

    if (!emailSent) {
      logger.error(`Failed to send OTP email to ${email}`, null, user._id);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again.'
      });
    }

    const duration = Date.now() - startTime;
    logger.auth(`OTP sent successfully (${user.otpRequestCount}/3 requests this hour)`, user._id, email, true);
    logger.response('POST', '/api/auth/request-otp', 200, duration, user._id);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email.',
      note: 'Please check your inbox AND spam folder. OTP expires in 5 minutes.',
      requestsRemaining: MAX_REQUESTS_PER_HOUR - user.otpRequestCount
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Request OTP error', error, null);
    logger.response('POST', '/api/auth/request-otp', 500, duration);
    
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  const startTime = Date.now();
  const { email, otp } = req.body;
  
  logger.request(req);
  logger.auth(`OTP verification attempt`, null, email);

  try {
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and OTP'
      });
    }

    // Find user by email - include rate limit fields to reset them on success
    const user = await User.findOne({ email }).select(
      '+resetOtp +resetOtpExpire +otpAttempts +otpRequestCount +otpRequestWindowStart +otpBlockedUntil'
    );
    
    if (!user) {
      logger.warn(`OTP verification - user not found`, null, email);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.resetOtp || !user.resetOtpExpire) {
      return res.status(400).json({
        success: false,
        error: 'No OTP requested. Please request a new one.'
      });
    }

    // Check if OTP is expired
    if (user.resetOtpExpire < Date.now()) {
      // Clear expired OTP
      user.resetOtp = undefined;
      user.resetOtpExpire = undefined;
      user.otpAttempts = 0;
      await user.save();
      
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts (max 3 attempts)
    if (user.otpAttempts >= 3) {
      // Clear OTP after too many attempts
      user.resetOtp = undefined;
      user.resetOtpExpire = undefined;
      user.otpAttempts = 0;
      await user.save();
      
      return res.status(400).json({
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Hash the provided OTP for comparison
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Verify OTP
    if (hashedOtp !== user.resetOtp) {
      user.otpAttempts += 1;
      await user.save();
      
      logger.warn(`Invalid OTP attempt ${user.otpAttempts}/3`, user._id, email);
      
      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`
      });
    }

    // ✅ OTP is valid - Reset rate limiting counters
    user.otpRequestCount = 0;
    user.otpRequestWindowStart = null;
    user.otpBlockedUntil = null;

    // Generate reset token for next step
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store hashed reset token (valid for 15 minutes)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    
    // Clear OTP fields
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    user.otpAttempts = 0;
    
    await user.save();

    const duration = Date.now() - startTime;
    logger.auth(`OTP verified successfully - rate limits reset`, user._id, email, true);
    logger.response('POST', '/api/auth/verify-otp', 200, duration, user._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken: resetToken,
      note: 'You can now reset your password. This token expires in 15 minutes.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Verify OTP error', error, null);
    logger.response('POST', '/api/auth/verify-otp', 500, duration);
    
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    });
  }
};

// @desc    Reset password with token (from verified OTP)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  const startTime = Date.now();
  const { email, resetToken, newPassword, confirmPassword } = req.body;
  
  logger.request(req);
  logger.auth(`Password reset attempt with token`, null, email);

  try {
    // Validate inputs
    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Validate passwords
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Hash the reset token from request
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user by email and valid reset token
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn(`Invalid or expired reset token used for ${email}`);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token. Please request a new OTP.'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new auth token for auto-login
    const authToken = generateToken(user);

    const duration = Date.now() - startTime;
    logger.auth(`Password reset successful`, user._id, email, true);
    logger.response('POST', '/api/auth/reset-password', 200, duration, user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
      token: authToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Reset password error', error, null);
    logger.response('POST', '/api/auth/reset-password', 500, duration);
    
    res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.'
    });
  }
};