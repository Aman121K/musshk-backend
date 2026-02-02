const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: String,
    size: String,
    price: Number,
    quantity: Number,
    image: String,
  }],
  total: {
    type: Number,
    default: 0,
  },
  // Checkout information (filled when user proceeds to checkout)
  shippingAddress: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online'],
  },
  // Status: 'active' (in cart), 'pending' (checkout initiated), 'converted' (became order), 'expired'
  status: {
    type: String,
    enum: ['active', 'pending', 'converted', 'expired'],
    default: 'active',
  },
  // Razorpay order ID (for tracking)
  razorpayOrderId: String,
  // Reference to order if converted
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  // Expiry date for pending carts (for discount campaigns)
  expiresAt: {
    type: Date,
    default: function() {
      // Pending carts expire after 7 days
      if (this.status === 'pending') {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    },
  },
}, {
  timestamps: true,
});

// Index for finding pending carts
cartSchema.index({ status: 1, expiresAt: 1 });
cartSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Cart', cartSchema);
