const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const startTime = Date.now();
  const { email, fullName, password, phoneNumber } = req.body;
  
  logger.request(req);
  logger.auth(`Registration attempt`, null, email);

  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      logger.warn(`Registration validation failed: ${errorMessages.join(', ')}`, null, email);
      
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    // ✅ ADD THIS: Validate that full name contains at least two words
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        logger.warn(`Registration failed - full name required (first and last name)`, null, email);
        
        return res.status(400).json({
          success: false,
          errors: [
            {
              field: "fullName",
              message: "Please enter your full name (first and last name)"
            }
          ]
        });
      }
    }

    // Split full name into first and last name
    let firstName = '';
    let lastName = '';
    
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration failed - email already exists`, existingUser._id, email);
      
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber: phoneNumber || '',
      loginCount: 0
    });

    logger.database(`User created in database`, { 
      userId: user._id, 
      email: user.email,
      name: `${firstName} ${lastName}`.trim()
    });

    // Generate token
    const token = generateToken(user);

    // Send combined welcome email
    logger.activity('Triggering welcome email', user._id, user.email);
    
    emailService.sendWelcomeEmail(user).catch(err => {
      logger.error('Welcome email failed in background', err, user._id);
    });

    const duration = Date.now() - startTime;
    logger.auth(`Registration successful`, user._id, user.email, true);
    logger.response('POST', '/api/auth/register', 201, duration, user._id);
    logger.activity('Account created', user._id, user.email, { 
      name: `${firstName} ${lastName}`.trim(),
      phoneNumber: phoneNumber || 'Not provided'
    });

    // Return success
    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to CV Builder.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        token
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Registration error', error, null);
    logger.response('POST', '/api/auth/register', 500, duration);
    
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const startTime = Date.now();
  const { email } = req.body;
  
  logger.request(req);
  logger.auth(`Login attempt`, null, email);

  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      logger.warn(`Login validation failed: ${errorMessages.join(', ')}`, null, email);
      
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      logger.warn(`Login failed - user not found`, null, email);
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      logger.warn(`Login failed - invalid password`, user._id, email);
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if this is first login
    const isFirstLogin = user.loginCount === 0;

    // Update login stats
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // Generate token
    const token = generateToken(user);

    const duration = Date.now() - startTime;
    logger.auth(`Login successful`, user._id, email, true);
    logger.response('POST', '/api/auth/login', 200, duration, user._id);
    logger.activity('User logged in', user._id, email, { 
      loginCount: user.loginCount,
      isFirstLogin,
      lastLogin: user.lastLogin
    });

    // Prepare response message
    const message = isFirstLogin 
      ? 'Welcome to CV Builder! Your account is ready.'
      : `Welcome back, ${user.firstName}!`;

    // Return success
    res.status(200).json({
      success: true,
      message,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
          isFirstLogin
        },
        token
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Login error', error, null);
    logger.response('POST', '/api/auth/login', 500, duration);
    
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const startTime = Date.now();
  
  logger.request(req, req.user.id);

  try {
    const user = await User.findById(req.user.id);
    
    logger.database(`User data retrieved`, { userId: user._id });
    
    const duration = Date.now() - startTime;
    logger.response('GET', '/api/auth/me', 200, duration, user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Get user error', error, req.user?.id);
    logger.response('GET', '/api/auth/me', 500, duration, req.user?.id);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
};

// ✅ EXPORT generateToken FUNCTION FOR USE IN OTHER CONTROLLERS
module.exports.generateToken = generateToken;