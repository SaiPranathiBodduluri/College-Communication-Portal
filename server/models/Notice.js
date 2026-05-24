const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'event', 'exam', 'circular', 'placement', 'general'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    roles: [{
      type: String,
      enum: ['admin', 'faculty', 'student']
    }],
    departments: [String],
    years: [String],
    sections: [String],
    studentFilters: [{
      dept: String,
      year: String,
      section: String,
      filterType: {
        type: String,
        enum: ['all', 'cr', 'lr', 'both', 'specific'],
        default: 'all'
      },
      specificIds: [String]
    }],
    specificUsers: {
      faculty: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
      }],
      admin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      }]
    }
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false  // Made optional for existing notices
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student'],
      required: false  // Made optional for existing notices
    },
    name: {
      type: String,
      required: false  // Made optional for existing notices
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String
  }],
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowFileSubmissions: {
    type: Boolean,
    default: false
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student'],
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  hiddenFrom: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      role: {
        type: String,
        enum: ['admin', 'faculty', 'student'],
        required: true
      },
      hiddenAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []  // Initialize as empty array for existing notices
  },
  acknowledgments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student'],
      required: true
    },
    userId: {
      type: String,
      required: false  // Made optional for existing data
    },
    name: {
      type: String,
      required: false  // Made optional for existing data
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student'],
      required: true
    },
    userId: {
      type: String,
      required: false  // Made optional for existing data
    },
    name: {
      type: String,
      required: false  // Made optional for existing data
    },
    content: String,
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      mimetype: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);