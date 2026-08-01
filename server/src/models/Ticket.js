const mongoose = require('mongoose');

// Ticket Status Enum
const ticketStatusEnum = [
  'New',
  'Waiting on contact',
  'Waiting on us',
  'In Progress',
  'Closed',
  'Resolved',
  'Cancelled'
];

// Priority Enum
const priorityEnum = [
  'Critical',
  'High',
  'Medium',
  'Low'
];

// Source Enum
const sourceEnum = [
  'Email',
  'Chat',
  'Phone',
  'Website',
  'Social Media',
  'Other'
];

const ticketSchema = new mongoose.Schema({
  // Basic Information
  ticketName: {
    type: String,
    required: [true, 'Ticket name is required'],
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    default: null
  },
  
  // Ticket Management
  ticketStatus: {
    type: String,
    enum: ticketStatusEnum,
    default: 'New',
    index: true
  },
  
  priority: {
    type: String,
    enum: priorityEnum,
    default: 'Medium',
    index: true
  },
  
  source: {
    type: String,
    enum: sourceEnum,
    default: 'Other',
    index: true
  },
  
  // Relationships
  ticketOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Ticket owner is required'],
    index: true
  },
  
 associatedDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal", 
      default: null,
    },
  associatedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
    index: true
  },
  
  // Additional Information
  resolution: {
    type: String,
    default: null
  },
  
  resolvedAt: {
    type: Date,
    default: null
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
  
  // Activity Timeline (simplified for now)
  activityLog: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'priority_changed', 'assigned', 'commented']
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
ticketSchema.index({ ticketStatus: 1, priority: 1 });
ticketSchema.index({ ticketOwner: 1, ticketStatus: 1 });
ticketSchema.index({ associatedDeal: 1 });
ticketSchema.index({ associatedCompany: 1 });
ticketSchema.index({ createdAt: -1 });

// Text index for search
ticketSchema.index({
  ticketName: 'text',
  description: 'text'
});

// Pre-save middleware
ticketSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// In Ticket model - Update getStatistics method
ticketSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$ticketStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await this.countDocuments();
  const byPriority = await this.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    total,
    byStatus: stats,
    byPriority,
    open: await this.countDocuments({ ticketStatus: { $nin: ['Closed', 'Resolved', 'Cancelled'] } }),
    closed: await this.countDocuments({ ticketStatus: { $in: ['Closed', 'Resolved'] } })
  };
};
module.exports = mongoose.model('Ticket', ticketSchema);