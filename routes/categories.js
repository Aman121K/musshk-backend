const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

const COLLECTION_BY_SLUG = {
  'best-seller': 'Best Seller',
  'niche-edition': 'Niche Edition',
  'inspired-perfumes': 'Inspired Perfumes',
  'new-arrivals': 'New Arrivals',
};

function toSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeProductIds(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(
    input
      .map((id) => String(id || '').trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
  )];
}

function buildCategoryPayload(body = {}, fallbackSlug = '') {
  const name = String(body.name || '').trim();
  const slug = toSlug(body.slug || fallbackSlug || name);
  const productIds = sanitizeProductIds(body.productIds);

  return {
    name,
    slug,
    image: body.image ? String(body.image).trim() : '',
    description: body.description ? String(body.description).trim() : '',
    featured: Boolean(body.featured),
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    productIds,
  };
}

async function syncCategoryCollections(slug, productIds) {
  const collectionName = COLLECTION_BY_SLUG[slug];
  if (!collectionName) return;

  await Product.updateMany(
    { _id: { $in: productIds } },
    { $addToSet: { collections: collectionName } }
  );

  await Product.updateMany(
    { _id: { $nin: productIds } },
    { $pull: { collections: collectionName } }
  );
}

async function syncCategoryCollectionsOnDelete(slug) {
  const collectionName = COLLECTION_BY_SLUG[slug];
  if (!collectionName) return;
  await Product.updateMany({}, { $pull: { collections: collectionName } });
}

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('productIds', '_id name slug code');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (Admin only)
router.post('/', async (req, res) => {
  try {
    const payload = buildCategoryPayload(req.body || {});
    if (!payload.name || !payload.slug) {
      return res.status(400).json({ error: 'Category name and slug are required' });
    }

    const category = await Category.create(payload);
    await syncCategoryCollections(category.slug, payload.productIds);

    const populated = await Category.findById(category._id).populate('productIds', '_id name slug code');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upsert category by slug (Admin only)
router.put('/slug/:slug', async (req, res) => {
  try {
    const routeSlug = toSlug(req.params.slug || '');
    if (!routeSlug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const payload = buildCategoryPayload(req.body || {}, routeSlug);
    payload.slug = routeSlug;

    if (!payload.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await Category.findOneAndUpdate(
      { slug: routeSlug },
      payload,
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    await syncCategoryCollections(category.slug, payload.productIds);
    const populated = await Category.findById(category._id).populate('productIds', '_id name slug code');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single category by id
router.get('/id/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('productIds', '_id name slug code');
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category by slug
router.get('/:slug', async (req, res) => {
  try {
    const slug = toSlug(req.params.slug || '');
    const category = await Category.findOne({ slug }).populate('productIds', '_id name slug code');
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category by id (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const existing = await Category.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const payload = buildCategoryPayload(req.body || {}, existing.slug);
    if (!payload.name || !payload.slug) {
      return res.status(400).json({ error: 'Category name and slug are required' });
    }

    if (existing.slug !== payload.slug) {
      await syncCategoryCollectionsOnDelete(existing.slug);
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    await syncCategoryCollections(category.slug, payload.productIds);
    const populated = await Category.findById(category._id).populate('productIds', '_id name slug code');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category by id (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await syncCategoryCollectionsOnDelete(category.slug);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
