const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // 👈 ADD THIS AT THE TOP

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 👇 NEW FIELDS FOR OTP PASSWORD RESET
  resetOtp: {
    type: String,
    select: false
  },
  resetOtpExpire: {
    type: Date,
    select: false
  },
  otpAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  // 👇 NEW FIELDS FOR RESET TOKEN (AFTER OTP VERIFICATION)
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
   // 👇 NEW RATE LIMITING FIELDS (ADD THESE)
  otpRequestCount: {
    type: Number,
    default: 0,
    select: false
  },
  otpRequestWindowStart: {
    type: Date,
    default: null,
    select: false
  },
  otpBlockedUntil: {
    type: Date,
    default: null,
    select: false
  }
  
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 👇 NEW METHOD: Generate 6-digit OTP
userSchema.methods.generateOtp = function() {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP before saving (security)
  this.resetOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  // OTP expires in 5 minutes
  this.resetOtpExpire = Date.now() + 5 * 60 * 1000;
  
  // Reset attempts
  this.otpAttempts = 0;
  
  return otp; // Return plain OTP to send via email
};

// 👇 NEW METHOD: Verify OTP
userSchema.methods.verifyOtp = function(enteredOtp) {
  // Hash the entered OTP
  const hashedOtp = crypto
    .createHash('sha256')
    .update(enteredOtp)
    .digest('hex');
  
  // Check if OTP matches and is not expired
  return this.resetOtp === hashedOtp && this.resetOtpExpire > Date.now();
};

// 👇 NEW METHOD: Generate reset token (after OTP verification)
userSchema.methods.generateResetToken = function() {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  
  return resetToken;
};

// Return user object without sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  delete user.resetOtp;        // 👈 Also remove OTP fields
  delete user.resetOtpExpire;
  delete user.otpAttempts;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

module.exports = mongoose.model('User', userSchema);