const mongoose = require('mongoose');

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
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  industryType: {
    type: String,
    required: [true, 'Industry type is required'],
    trim: true
  },
  countryOrRegion: {
    type: String,
    required: [true, 'Country or region is required'],
    trim: true
  },
  role: {
    type: String,
    enum: {
      values: ['Admin', 'Manager', 'Sales'],
      message: 'Role must be either Admin, Manager, or Sales'
    },
    default: 'Sales'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Reset Password Fields - REMOVED select: false
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  // Email Verification Fields
  emailVerificationToken: {
    type: String,
    default: null
  },

  emailVerificationExpire: {
    type: Date,
    default: null
  },
 // Add these fields to your userSchema
resetOTP: {
  type: String,
  default: null
},
resetOTPExpire: {
  type: Date,
  default: null
},
resetOTPAttempts: {
  type: Number,
  default: 0
},
lastOTPRequest: {
  type: Date,
  default: null
}
}, {
  timestamps: true
});

// Remove password and tokens when converting to JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpire;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);