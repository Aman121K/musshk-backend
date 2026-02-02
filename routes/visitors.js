const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const User = require('../models/User');

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
};

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser detection
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Device detection
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { browser, os, device };
};

// Track visitor
router.post('/', async (req, res) => {
  try {
    const { sessionId, page, referrer } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseUserAgent(userAgent);

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Find existing visitor by sessionId
    let visitor = await Visitor.findOne({ sessionId, isActive: true });

    if (visitor) {
      // Update existing visitor
      visitor.lastVisit = new Date();
      visitor.visitCount += 1;
      visitor.page = page || visitor.page;
      visitor.referrer = referrer || visitor.referrer;
      visitor.ipAddress = ipAddress;
      visitor.userAgent = userAgent;
      visitor.deviceInfo = deviceInfo;
      await visitor.save();
    } else {
      // Create new visitor
      visitor = new Visitor({
        sessionId,
        ipAddress,
        userAgent,
        referrer,
        page,
        deviceInfo,
        role: 'guest',
        isActive: true,
      });
      await visitor.save();
    }

    res.json({
      success: true,
      visitor: {
        id: visitor._id,
        sessionId: visitor.sessionId,
        role: visitor.role,
        visitCount: visitor.visitCount,
      },
    });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get visitor by session ID
router.get('/session/:sessionId', async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ 
      sessionId: req.params.sessionId,
      isActive: true 
    });

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json(visitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update visitor to active user (called on login)
router.put('/activate/:visitorId', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const visitor = await Visitor.findById(req.params.visitorId);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Update visitor to active user
    visitor.userId = userId;
    visitor.role = 'active';
    visitor.isActive = true;
    await visitor.save();

    // Update user with visitor reference
    await User.findByIdAndUpdate(userId, {
      visitorId: visitor._id,
      isActive: true,
      lastLogin: new Date(),
      $inc: { loginCount: 1 },
    });

    res.json({
      success: true,
      message: 'Visitor activated as user',
      visitor,
    });
  } catch (error) {
    console.error('Error activating visitor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all visitors (Admin only)
router.get('/', async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const visitors = await Visitor.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Visitor.countDocuments(query);

    res.json({
      visitors,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visitor statistics
router.get('/stats', async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const activeUsers = await Visitor.countDocuments({ role: 'active', isActive: true });
    const guests = await Visitor.countDocuments({ role: 'guest', isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisitors = await Visitor.countDocuments({ createdAt: { $gte: today } });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthVisitors = await Visitor.countDocuments({ createdAt: { $gte: thisMonth } });

    res.json({
      totalVisitors,
      activeUsers,
      guests,
      todayVisitors,
      monthVisitors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

