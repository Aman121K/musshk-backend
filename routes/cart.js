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

// Update cart with checkout information (shipping address, payment method)
// This is called when user proceeds to checkout
// IMPORTANT: This route must come BEFORE /:sessionId/:itemId to avoid route conflicts
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

// Remove item from cart by productId (new endpoint - accepts productId in body)
router.delete('/:sessionId/item', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required in request body' });
    }

    const cart = await Cart.findOne({ 
      sessionId,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const initialItemCount = cart.items.length;

    // Filter out the item by productId
    cart.items = cart.items.filter(item => {
      return item.productId && item.productId.toString() !== productId;
    });

    // Check if item was actually removed
    if (cart.items.length === initialItemCount) {
      return res.status(404).json({ 
        error: 'Item not found in cart',
        cart: cart 
      });
    }

    // Recalculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    res.json({
      message: 'Item removed from cart',
      cart: cart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove item from cart (accepts productId in body or itemId in URL)
router.delete('/:sessionId/:itemId', async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    const { productId, item } = req.body; // Support productId from body or item object

    const cart = await Cart.findOne({ 
      sessionId,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Extract productId from various sources
    let identifierToRemove = productId;
    
    // If productId not in body, try to get it from item object
    if (!identifierToRemove && item) {
      identifierToRemove = item.productId || item._id || item.id;
    }
    
    // If still not found, try to use itemId from URL (if valid)
    if (!identifierToRemove && itemId && itemId !== '[object Object]' && itemId !== '[object%20Object]') {
      identifierToRemove = itemId;
    }

    // If itemId is [object Object] and no productId provided, return helpful error with cart items
    if (!identifierToRemove || itemId === '[object Object]' || itemId === '[object%20Object]') {
      return res.status(400).json({ 
        error: 'Invalid item identifier. Please provide productId in request body.',
        hint: 'Send productId in request body: {"productId": "your-product-id"}',
        example: {
          method: 'DELETE',
          url: `/api/cart/${sessionId}/item`,
          body: { productId: cart.items[0]?.productId?.toString() || 'product-id-here' }
        },
        availableItems: cart.items.map(i => ({
          productId: i.productId?.toString(),
          name: i.name,
          itemId: i._id?.toString()
        }))
      });
    }

    const initialItemCount = cart.items.length;

    // Filter out the item - match by productId or item _id
    cart.items = cart.items.filter(item => {
      // Match by productId
      if (item.productId && item.productId.toString() === identifierToRemove) {
        return false; // Remove this item
      }
      
      // Match by item _id (for cases where itemId is the cart item's _id)
      if (item._id && item._id.toString() === identifierToRemove) {
        return false; // Remove this item
      }
      
      return true; // Keep this item
    });

    // Check if item was actually removed
    if (cart.items.length === initialItemCount) {
      return res.status(404).json({ 
        error: 'Item not found in cart',
        cart: cart 
      });
    }

    // Recalculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    res.json({
      message: 'Item removed from cart',
      cart: cart
    });
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

module.exports = router;
