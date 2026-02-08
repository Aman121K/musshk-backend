const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security & performance middleware (before routes)
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// Rate limiting: 200 requests per 1 min per IP (handles 2k+ users with burst protection)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl === '/api/health' || req.originalUrl?.endsWith('/api/health'),
});
app.use('/api/', apiLimiter);

// CORS: allow admin and main site (and localhost for dev); required for Authorization from admin.musshk.com
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : ['https://admin.musshk.com', 'https://musshk.com', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin or server-to-server
    if (corsOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
}));

// Webhook route needs raw body, so we handle it before JSON parsing
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for all other routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// MongoDB Connection (pool for 2k+ concurrent users)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/musk';

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart')); // Cart API for website (admin endpoints removed)
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/discounts', require('./routes/discounts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/import', require('./routes/import'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/marketplaces', require('./routes/marketplaces'));
app.use('/api/subscribers', require('./routes/subscribers'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Musshk Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      blogs: '/api/blogs',
      testimonials: '/api/testimonials',
      banners: '/api/banners',
      marketplaces: '/api/marketplaces',
      subscribers: '/api/subscribers',
      discounts: '/api/discounts',
      users: '/api/users',
      orders: '/api/orders',
      auth: '/api/auth',
      upload: '/api/upload'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
});

