const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
  },
  images: [{
    type: String,
  }],
  category: {
    type: String,
    required: true,
    enum: ['Inspired Perfumes', 'Niche Edition', 'Luxe Edition', 'Gift Sets', 'Body Lotions', 'Shower Gel', 'Beauty', 'Espresso Blends', 'Single Origin', 'Decaf', 'Accessories'],
  },
  subCategory: {
    type: String,
  },
  tags: [{
    type: String,
  }],
  sizes: [{
    size: String,
    price: Number,
    stock: Number,
  }],
  stock: {
    type: Number,
    default: 0,
  },
  reviews: [{
    user: String,
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  newArrival: {
    type: Boolean,
    default: false,
  },
  notes: [{
    type: String,
  }],
  soldOut: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);

