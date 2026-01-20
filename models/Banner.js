const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  position: {
    type: String,
    enum: ['home-top', 'home-middle', 'home-bottom', 'category-top'],
    default: 'home-top',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Banner', bannerSchema);

