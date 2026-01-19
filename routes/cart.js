const express = require('express');
const router = express.Router();

// In-memory cart storage (in production, use Redis or database)
let carts = {};

// Get cart
router.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const cart = carts[sessionId] || { items: [], total: 0 };
  res.json(cart);
});

// Add to cart
router.post('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { productId, name, size, price, quantity, image } = req.body;

  if (!carts[sessionId]) {
    carts[sessionId] = { items: [], total: 0 };
  }

  const existingItemIndex = carts[sessionId].items.findIndex(
    item => item.productId === productId && item.size === size
  );

  if (existingItemIndex > -1) {
    carts[sessionId].items[existingItemIndex].quantity += quantity;
  } else {
    carts[sessionId].items.push({
      productId,
      name,
      size,
      price,
      quantity,
      image,
    });
  }

  carts[sessionId].total = carts[sessionId].items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  res.json(carts[sessionId]);
});

// Update cart item
router.put('/:sessionId/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;
  const { quantity } = req.body;

  if (!carts[sessionId]) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  const item = carts[sessionId].items.find(item => item.productId === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  item.quantity = quantity;
  carts[sessionId].total = carts[sessionId].items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  res.json(carts[sessionId]);
});

// Remove from cart
router.delete('/:sessionId/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;

  if (!carts[sessionId]) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  carts[sessionId].items = carts[sessionId].items.filter(
    item => item.productId !== itemId
  );

  carts[sessionId].total = carts[sessionId].items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  res.json(carts[sessionId]);
});

// Clear cart
router.delete('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  delete carts[sessionId];
  res.json({ message: 'Cart cleared' });
});

module.exports = router;

