const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  referrer: {
    type: String,
  },
  page: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  role: {
    type: String,
    enum: ['guest', 'active'],
    default: 'guest',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastVisit: {
    type: Date,
    default: Date.now,
  },
  visitCount: {
    type: Number,
    default: 1,
  },
  deviceInfo: {
    type: {
      browser: String,
      os: String,
      device: String,
    },
  },
  location: {
    type: {
      country: String,
      city: String,
      region: String,
    },
  },
}, {
  timestamps: true,
});

// Index for faster queries
visitorSchema.index({ sessionId: 1, userId: 1 });
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);

