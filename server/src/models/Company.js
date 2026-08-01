  const mongoose = require("mongoose");

  // Industry enum based on common business types
  const industryEnum = [
    'Technology',
    'Real Estate',
    'Legal Services',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Consulting',
    'Marketing',
    'Construction',
    'Hospitality',
    'Transportation',
    'Energy',
    'Agriculture',
    'Other'
  ];

  // Company type enum (merged both versions)
  const companyTypeEnum = [
    "Corporation",
    "Partnership",
    "LLC",
    "Private Limited",
    "Public Limited",
    "Sole Proprietorship",
    "Public",
    "Private",
    "Non-Profit",
    "Government"
  ];

  // Lead status enum for filtering
  const leadStatusEnum = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost',
    'Inactive'
  ];

  const companySchema = new mongoose.Schema(
    {
      // Basic Information
      companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        index: true
      },
      
      domainName: {
        type: String,
        required: [true, 'Domain name is required'],
        trim: true,
        lowercase: true,
        unique: true,
        index: true
      },
      
      website: {
        type: String,
        trim: true,
        default: null
      },
      
      companyOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Company owner is required'],
        index: true
      },
      
      industry: {
        type: String,
        required: [true, 'Industry is required'],
        enum: industryEnum,
        index: true
      },
      
      type: {
        type: String,
        required: [true, 'Company type is required'],
        enum: companyTypeEnum,
        default: "Corporation",
        index: true
      },
      
      // Contact Information
      email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
        index: true
      },
      
      phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        index: true
      },
      
      // Location Information
      city: {
        type: String,
        trim: true,
        index: true
      },
      
      countryRegion: {
        type: String,
        trim: true,
        index: true
      },
      
      country: {
        type: String,
        trim: true,
        default: null
      },
      
      address: {
        street: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        zipCode: { type: String, default: null },
        country: { type: String, default: null },
        // Plain address field for backward compatibility
        fullAddress: { type: String, trim: true, default: null }
      },
      
      description: {
        type: String,
        trim: true,
        default: null
      },
      
      // Business Metrics
      noOfEmployees: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
        default: null
      },
      
      annualRevenue: {
        type: Number,
        min: 0,
        default: null
      },
      
      // Lead Management
      leadStatus: {
        type: String,
        enum: leadStatusEnum,
        default: 'New',
        index: true
      },
      
      // AI Generated Summary
      aiSummary: {
        type: String,
        default: null
      },
      
      // Attachments
      attachments: [{
        fileName: {
          type: String,
          required: true
        },
        fileUrl: {
          type: String,
          required: true
        },
        fileType: {
          type: String,
          enum: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'txt', 'other'],
          default: 'other'
        },
        fileSize: {
          type: Number,
          default: 0
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }],
      
      // Social Media (Optional)
      socialMedia: {
        linkedin: { type: String, default: null },
        twitter: { type: String, default: null },
        facebook: { type: String, default: null },
        instagram: { type: String, default: null }
      },
      
      // Status
      status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
        index: true
      },
      
      isActive: {
        type: Boolean,
        default: true,
        index: true
      },
      
      // Metadata
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    {
      timestamps: true,
    }
  );

  // Compound indexes for common search combinations
  companySchema.index({ companyName: 1, leadStatus: 1 });
  companySchema.index({ city: 1, industry: 1 });
  companySchema.index({ countryRegion: 1, leadStatus: 1 });
  companySchema.index({ createdAt: -1 });

  // Text index for search functionality
  companySchema.index({
    companyName: 'text',
    domainName: 'text',
    city: 'text',
    industry: 'text'
  });

  // Virtual for full address
  companySchema.virtual('fullAddress').get(function() {
    const parts = [this.address?.street, this.address?.city, this.address?.state, this.address?.zipCode, this.address?.country].filter(Boolean);
    return parts.join(', ');
  });

  // Pre-save middleware
  companySchema.pre('save', function(next) {
    if (this.isModified()) {
      this.updatedAt = Date.now();
    }
    next();
  });

  // Static method to get company statistics
  companySchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$leadStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$annualRevenue' }
        }
      }
    ]);
    
    const total = await this.countDocuments();
    
    return {
      total,
      byLeadStatus: stats,
      active: await this.countDocuments({ isActive: true }),
      inactive: await this.countDocuments({ isActive: false })
    };
  };

  module.exports = mongoose.model("Company", companySchema);
