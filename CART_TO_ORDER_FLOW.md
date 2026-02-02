# Cart to Order Conversion Flow

## Overview
This document explains the complete cart-based order flow where carts are stored as pending orders and converted to final orders via Razorpay webhook after payment confirmation.

## Flow Architecture

### 1. Cart Creation & Management
- **Cart Model**: Carts are stored in MongoDB with status: `active`, `pending`, `converted`, or `expired`
- **Cart Lifecycle**:
  - `active`: User is shopping, items in cart
  - `pending`: User proceeded to checkout, payment initiated
  - `converted`: Payment confirmed, cart converted to order
  - `expired`: Cart expired (after 7 days for pending carts)

### 2. Checkout Flow

#### Step 1: User Adds Items to Cart
- Items stored in cart with `status: 'active'`
- Cart persists in database (not in-memory)

#### Step 2: User Proceeds to Checkout
- User fills shipping address and selects payment method
- Frontend calls: `PUT /api/cart/:sessionId/checkout`
- Cart updated with:
  - `shippingAddress`
  - `paymentMethod` (COD or Online)
  - `status: 'pending'`
  - `expiresAt: 7 days from now`

#### Step 3: Payment Processing

**For Online Payment:**
1. Frontend calls: `POST /api/payment/create-order`
   - Passes `cartId` in notes
   - Razorpay order created
   - Cart updated with `razorpayOrderId`
2. Razorpay checkout modal opens
3. User completes payment
4. Frontend calls: `POST /api/payment/verify-payment`
   - Verifies payment signature
   - Converts cart to order immediately (for faster UX)
   - **OR** waits for webhook (more reliable)

**For COD Payment:**
1. Frontend calls: `POST /api/orders`
2. Order created immediately with `status: 'Processing'`, `paymentStatus: 'Pending'`
3. Cart marked as `converted`

### 3. Webhook Flow (Primary Conversion Method)

When Razorpay confirms payment, webhook is triggered:

**Endpoint**: `POST /api/payment/webhook`

**Events Handled:**
- `payment.captured`: Payment successfully captured
- `payment.authorized`: Payment authorized (for manual capture)
- `payment.failed`: Payment failed

**Process:**
1. Webhook receives event with `cartId` in payment notes
2. Verifies webhook signature
3. Finds cart by `cartId`
4. If cart status is `pending`:
   - Converts cart to order
   - Updates cart status to `converted`
   - Links order to cart via `cart.orderId`
5. Sends order confirmation email to customer
6. Order created with:
   - `paymentStatus: 'Paid'`
   - `orderStatus: 'Processing'`
   - All payment details stored

### 4. Email Notification

When cart is converted to order via webhook:
- Email sent to customer using `sendOrderConfirmation()`
- Email includes:
  - Order number
  - Order items
  - Total amount
  - Shipping address
  - Payment details
  - Order status

## Database Models

### Cart Model
```javascript
{
  sessionId: String,
  user: ObjectId (ref: User),
  items: [{
    productId: ObjectId,
    name: String,
    size: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  total: Number,
  shippingAddress: {
    name, email, phone, address, city, state, pincode, country
  },
  paymentMethod: 'COD' | 'Online',
  status: 'active' | 'pending' | 'converted' | 'expired',
  razorpayOrderId: String,
  orderId: ObjectId (ref: Order),
  expiresAt: Date
}
```

### Order Model
```javascript
{
  orderNumber: String,
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId,
    name, size, quantity, price
  }],
  totalAmount: Number,
  email: String,
  shippingAddress: {...},
  paymentMethod: 'COD' | 'Online',
  paymentStatus: 'Pending' | 'Paid' | 'Failed',
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled',
  paymentDetails: {
    razorpay_order_id, razorpay_payment_id, ...
  }
}
```

## API Endpoints

### Cart Endpoints
- `GET /api/cart/:sessionId` - Get cart
- `POST /api/cart/:sessionId` - Add item to cart
- `PUT /api/cart/:sessionId/:itemId` - Update cart item
- `DELETE /api/cart/:sessionId/:itemId` - Remove item
- `DELETE /api/cart/:sessionId` - Clear cart
- `PUT /api/cart/:sessionId/checkout` - Update cart with checkout info
- `GET /api/cart/admin/pending` - Get pending carts (admin)
- `GET /api/cart/admin/all` - Get all carts (admin)

### Payment Endpoints
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment (frontend)
- `POST /api/payment/webhook` - Razorpay webhook (backend)

### Order Endpoints
- `POST /api/orders` - Create order (for COD)
- `GET /api/orders` - Get all orders
- `GET /api/orders/user/:userId` - Get user orders
- `GET /api/orders/:id` - Get order details

## Admin Panel

### Carts Page (`/admin/carts`)
- View all pending carts
- Filter by status (pending, active, all)
- View cart details:
  - Customer information
  - Items
  - Total value
  - Shipping address
  - Payment method
  - Expiry date
- Statistics:
  - Pending carts count
  - Active carts count
  - Total value of pending carts

### Orders Page (`/admin/orders`)
- View all converted orders
- Filter by status
- Manage order status
- View payment details including payment IDs
- Add tracking numbers

## Benefits of This Flow

1. **Pending Cart Storage**: Carts are stored as pending, allowing for:
   - Discount campaigns targeting abandoned carts
   - Analytics on cart abandonment
   - Recovery of lost sales

2. **Reliable Order Creation**: Webhook ensures orders are created even if:
   - User closes browser after payment
   - Network issues during payment
   - Frontend verification fails

3. **Email Notifications**: Automatic email sent when payment confirmed via webhook

4. **Separation of Concerns**: 
   - Carts section for pending/abandoned carts
   - Orders section for confirmed orders

5. **Better Analytics**: Track conversion rates, cart abandonment, etc.

## Migration Notes

### From In-Memory to Database
The cart system has been migrated from in-memory storage to MongoDB. Existing carts in memory will need to be migrated or users will need to re-add items.

### Backward Compatibility
- Frontend still uses `sessionId` for cart identification
- Cart API endpoints remain the same
- New endpoints added for checkout and admin

## Testing

### Test Scenarios
1. **Online Payment Success**:
   - Add items to cart
   - Proceed to checkout
   - Complete payment
   - Verify order created via webhook
   - Verify email sent

2. **Online Payment Failure**:
   - Add items to cart
   - Proceed to checkout
   - Payment fails
   - Verify cart remains pending
   - Verify no order created

3. **COD Payment**:
   - Add items to cart
   - Proceed to checkout
   - Select COD
   - Verify order created immediately
   - Verify cart marked as converted

4. **Webhook Processing**:
   - Simulate webhook event
   - Verify cart converted to order
   - Verify email sent
   - Verify payment details stored

## Environment Variables

```env
RAZORPAY_KEY_ID=rzp_test_SBJlI3LInAUFFp
RAZORPAY_KEY_SECRET=1pxn1a7tc9vKiOwQQ0D4Pt33
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
MONGODB_URI=your_mongodb_connection_string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=Musshk <noreply@musshk.com>
```

## Troubleshooting

### Cart Not Converting to Order
- Check webhook URL is correct in Razorpay dashboard
- Verify webhook secret matches
- Check server logs for webhook events
- Verify cartId is in payment notes

### Email Not Sending
- Check SMTP configuration
- Verify email service credentials
- Check server logs for email errors
- Email failures don't block order creation

### Pending Carts Not Showing
- Verify cart status is 'pending'
- Check cart expiry date
- Verify admin authentication
