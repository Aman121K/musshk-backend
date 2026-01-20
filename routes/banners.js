const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// Get all banners
router.get('/', async (req, res) => {
  try {
    const { position, active } = req.query;
    const query = {};

    if (position) query.position = position;
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;

    const banners = await Banner.find(query)
      .sort({ createdAt: -1 });

    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single banner
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create banner (Admin)
router.post('/', async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update banner (Admin)
router.put('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    res.json(banner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete banner (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

