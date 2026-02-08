const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  source: {
    type: String,
    default: 'website',
  },
}, {
  timestamps: true,
});

subscriberSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
