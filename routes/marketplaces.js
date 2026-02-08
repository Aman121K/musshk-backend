const express = require('express');
const router = express.Router();
const Marketplace = require('../models/Marketplace');

// Get all marketplaces (public: only active for website; admin: use ?all=true for all)
router.get('/', async (req, res) => {
  try {
    const { active, all } = req.query;
    const query = {};
    if (all === 'true') {
      // Admin: return all
    } else if (active === 'true' || active === 'false') {
      query.isActive = active === 'true';
    } else {
      query.isActive = true; // Website: only active
    }

    const marketplaces = await Marketplace.find(Object.keys(query).length ? query : {})
      .sort({ order: 1, createdAt: 1 });

    res.json(marketplaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single marketplace
router.get('/:id', async (req, res) => {
  try {
    const marketplace = await Marketplace.findById(req.params.id);
    if (!marketplace) {
      return res.status(404).json({ error: 'Marketplace not found' });
    }
    res.json(marketplace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create marketplace (Admin)
router.post('/', async (req, res) => {
  try {
    const marketplace = new Marketplace(req.body);
    await marketplace.save();
    res.status(201).json(marketplace);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update marketplace (Admin)
router.put('/:id', async (req, res) => {
  try {
    const marketplace = await Marketplace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!marketplace) {
      return res.status(404).json({ error: 'Marketplace not found' });
    }
    res.json(marketplace);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete marketplace (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const marketplace = await Marketplace.findByIdAndDelete(req.params.id);
    if (!marketplace) {
      return res.status(404).json({ error: 'Marketplace not found' });
    }
    res.json({ message: 'Marketplace deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
