const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// Subscribe (public - from website footer)
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existing = await Subscriber.findOne({ email: normalized });
    if (existing) {
      return res.status(200).json({ message: 'Already subscribed', subscribed: true });
    }

    await Subscriber.create({ email: normalized, source: req.body.source || 'website' });
    res.status(201).json({ message: 'Subscribed successfully', subscribed: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ message: 'Already subscribed', subscribed: true });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
