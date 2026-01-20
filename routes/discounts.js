const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');

// Get all discounts
router.get('/', async (req, res) => {
  try {
    const { active, code } = req.query;
    const query = {};

    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;
    if (code) query.code = code.toUpperCase();

    const discounts = await Discount.find(query)
      .sort({ createdAt: -1 });

    res.json(discounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single discount
router.get('/:id', async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.json(discount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate discount code (public)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Discount code is required' });
    }

    const discount = await Discount.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!discount) {
      return res.status(404).json({ error: 'Invalid or inactive discount code' });
    }

    const now = new Date();
    if (now < discount.validFrom || now > discount.validUntil) {
      return res.status(400).json({ error: 'Discount code has expired' });
    }

    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({ error: 'Discount code usage limit reached' });
    }

    res.json({
      valid: true,
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minPurchase: discount.minPurchase,
        maxDiscount: discount.maxDiscount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create discount (Admin)
router.post('/', async (req, res) => {
  try {
    const discount = new Discount(req.body);
    await discount.save();
    res.status(201).json(discount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update discount (Admin)
router.put('/:id', async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!discount) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.json(discount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete discount (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

