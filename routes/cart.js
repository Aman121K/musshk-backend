const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Get cart by sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ 
      sessionId: req.params.sessionId,
      status: { $in: ['active', 'pending'] }
    }).populate('items.productId', 'name images');

    if (!cart) {
      return res.json({ items: [], total: 0 });
    }

    res.json({
      _id: cart._id,
      items: cart.items,
      total: cart.total,
      status: cart.status,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add to cart
router.post('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, name, size, price, quantity, image, userId } = req.body;

    let cart = await Cart.findOne({ 
      sessionId,
      status: 'active'
    });

    if (!cart) {
      cart = new Cart({
        sessionId,
        user: userId || null,
        items: [],
        total: 0,
        status: 'active',
      });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.size === size
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name,
        size,
        price,
        quantity,
        image,
      });
    }

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update cart item quantity
router.put('/:sessionId/:itemId', async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ 
      sessionId,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find(item => item.productId.toString() === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.quantity = quantity;
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove from cart
router.delete('/:sessionId/:itemId', async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;

    const cart = await Cart.findOne({ 
      sessionId,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== itemId
    );

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear cart
router.delete('/:sessionId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (cart) {
      cart.items = [];
      cart.total = 0;
      cart.status = 'active';
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update cart with checkout information (shipping address, payment method)
// This is called when user proceeds to checkout
router.put('/:sessionId/checkout', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { shippingAddress, paymentMethod, userId } = req.body;

    const cart = await Cart.findOne({ 
      sessionId,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    cart.shippingAddress = shippingAddress;
    cart.paymentMethod = paymentMethod;
    cart.status = 'pending';
    cart.user = userId || cart.user;
    cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error updating cart checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all pending carts (for admin)
router.get('/admin/pending', async (req, res) => {
  try {
    const carts = await Cart.find({ status: 'pending' })
      .populate('user', 'name email')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });
    res.json(carts);
  } catch (error) {
    console.error('Error fetching pending carts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all carts (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const carts = await Cart.find(query)
      .populate('user', 'name email')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });
    res.json(carts);
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
