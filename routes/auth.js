const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, sessionId } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ name, email, password, phone, isActive: true });
    await user.save();

    // If sessionId provided, convert guest visitor to active user
    if (sessionId) {
      const visitor = await Visitor.findOne({ sessionId, isActive: true });
      if (visitor) {
        visitor.userId = user._id;
        visitor.role = 'active';
        await visitor.save();

        // Link user with visitor
        user.visitorId = visitor._id;
        user.loginCount = 1;
        user.lastLogin = new Date();
        await user.save();
      }
    } else {
      user.loginCount = 1;
      user.lastLogin = new Date();
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, sessionId } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If sessionId provided, convert guest visitor to active user
    if (sessionId) {
      const visitor = await Visitor.findOne({ sessionId, isActive: true });
      if (visitor) {
        visitor.userId = user._id;
        visitor.role = 'active';
        await visitor.save();

        // Update user with visitor reference
        user.visitorId = visitor._id;
        user.isActive = true;
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();
      }
    } else {
      // Update user login info even if no sessionId
      user.isActive = true;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

