# Musk Backend API

Standalone backend API server for Musk Perfumery. This is a completely separate project that can be deployed independently.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/musk
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Install Dependencies (including AWS SDK)

```bash
npm install
# or
yarn install
```

### 4. Set Up AWS S3 (for image uploads)

1. Create an S3 bucket in AWS
2. Create an IAM user with S3 permissions
3. Add AWS credentials to `.env` file (see `ENV_SETUP.md` for details)

**Note:** If S3 is not configured, the upload API will still work but will store files locally.

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on **http://localhost:5000**

## 📡 API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:slug` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Blogs
- `GET /api/blogs` - List all blogs
- `GET /api/blogs/:slug` - Get single blog
- `POST /api/blogs` - Create blog (Admin)
- `PUT /api/blogs/:id` - Update blog (Admin)
- `DELETE /api/blogs/:id` - Delete blog (Admin)

### Testimonials
- `GET /api/testimonials` - List approved testimonials
- `GET /api/testimonials/admin/all` - List all (Admin)
- `POST /api/testimonials` - Create testimonial
- `PUT /api/testimonials/:id` - Update testimonial (Admin)
- `DELETE /api/testimonials/:id` - Delete testimonial (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id` - Update order

### Cart
- `GET /api/cart/:sessionId` - Get cart
- `POST /api/cart/:sessionId` - Add to cart
- `PUT /api/cart/:sessionId/:itemId` - Update cart item
- `DELETE /api/cart/:sessionId/:itemId` - Remove from cart

### Banners
- `GET /api/banners` - List all banners
- `GET /api/banners/:id` - Get single banner
- `POST /api/banners` - Create banner (Admin)
- `PUT /api/banners/:id` - Update banner (Admin)
- `DELETE /api/banners/:id` - Delete banner (Admin)

### Discounts
- `GET /api/discounts` - List all discounts
- `GET /api/discounts/:id` - Get single discount
- `POST /api/discounts` - Create discount (Admin)
- `POST /api/discounts/validate` - Validate discount code
- `PUT /api/discounts/:id` - Update discount (Admin)
- `DELETE /api/discounts/:id` - Delete discount (Admin)

### Users
- `GET /api/users` - List all users (Admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Upload
- `POST /api/upload/image?folder=banners` - Upload single image to S3
- `POST /api/upload/images?folder=products` - Upload multiple images to S3
  - Available folders: `banners`, `products`, `blogs`, `testimonials`, `discounts`, `uploads`

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Health Check
- `GET /api/health` - Server health check
- `GET /` - API information

## 🗄️ Database

### Seed Database (Optional)

Add sample products to your database:

```bash
npm run seed
```

## 📁 Project Structure

```
backend/
├── index.js              # Main server file
├── package.json          # Dependencies
├── .env                  # Environment variables (create from .env.example)
├── models/               # MongoDB models
│   ├── Product.js
│   ├── Blog.js
│   ├── Testimonial.js
│   ├── Banner.js
│   ├── Discount.js
│   ├── Order.js
│   ├── User.js
│   └── Category.js
├── routes/               # API routes
│   ├── products.js
│   ├── blogs.js
│   ├── testimonials.js
│   ├── banners.js
│   ├── discounts.js
│   ├── users.js
│   ├── orders.js
│   ├── cart.js
│   ├── auth.js
│   ├── upload.js
│   └── categories.js
├── utils/                # Utility functions
│   ├── s3.js            # S3 upload utilities
│   └── email.js
├── public/
│   └── uploads/          # Uploaded images
└── seed.js               # Database seeder
```

## 🔧 Configuration

### Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `CORS_ORIGINS` - Allowed CORS origins (optional, defaults to all)

### AWS S3 Configuration (for image uploads)

- `AWS_ACCESS_KEY_ID` - AWS access key ID (required for S3 uploads)
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key (required for S3 uploads)
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_S3_BUCKET_NAME` - S3 bucket name (required for S3 uploads)
- `AWS_S3_BASE_URL` - S3 base URL (optional, auto-generated if not provided)

See `ENV_SETUP.md` for detailed S3 setup instructions.

### MongoDB Setup

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/musk
```

**MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/musk
```

## 🚢 Deployment

### Deploy to Heroku

1. Create Heroku app:
```bash
heroku create musk-backend-api
```

2. Set environment variables:
```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret_key
heroku config:set PORT=5000
```

3. Deploy:
```bash
git push heroku main
```

### Deploy to Railway

1. Connect your repository
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Deploy to DigitalOcean

1. Create a Droplet
2. Install Node.js and MongoDB
3. Clone repository
4. Set up PM2:
```bash
npm install -g pm2
pm2 start index.js --name musk-api
pm2 save
pm2 startup
```

## 🔒 Security Notes

- Change `JWT_SECRET` in production
- Use environment variables for sensitive data
- Implement rate limiting
- Add authentication middleware for admin routes
- Validate file uploads
- Use HTTPS in production

## 📝 Usage in Frontend

Both the website and admin panel use this API by setting:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Or in production:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## 🧪 Testing

Test the API:

```bash
# Health check
curl http://localhost:5000/api/health

# Get products
curl http://localhost:5000/api/products
```

## 📞 Support

For issues or questions, check the main project documentation.

