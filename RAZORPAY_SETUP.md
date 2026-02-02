# Razorpay Payment Integration Setup Guide

## Overview
This document explains the complete Razorpay payment integration flow implemented in the Musshk e-commerce platform.

## Payment Flow

### 1. Order Creation Flow
1. User adds items to cart
2. User proceeds to checkout
3. User fills in delivery address and details
4. User selects payment method (COD or Online)
5. **Order is created immediately** with status:
   - COD: `orderStatus: 'Processing'`, `paymentStatus: 'Pending'`
   - Online: `orderStatus: 'Pending'`, `paymentStatus: 'Pending'`
6. For online payments, Razorpay payment is initialized

### 2. Online Payment Flow
1. Frontend calls `/api/payment/create-order` to create Razorpay order
2. Razorpay checkout modal opens
3. User completes payment
4. Frontend calls `/api/payment/verify-payment` to verify payment signature
5. Backend updates order:
   - `paymentStatus: 'Paid'`
   - `orderStatus: 'Processing'`
   - Stores payment details (payment ID, order ID, signature, etc.)
6. Cart is cleared
7. User redirected to order success page

### 3. Webhook Flow (Backup Verification)
Razorpay sends webhook events to `/api/payment/webhook`:
- **payment.captured**: Payment successfully captured
- **payment.authorized**: Payment authorized (for manual capture)
- **payment.failed**: Payment failed

The webhook handler:
- Verifies webhook signature
- Updates order status accordingly
- Acts as a backup verification mechanism

## Configuration

### Environment Variables
Add these to your `.env` file in the backend:

```env
RAZORPAY_KEY_ID=rzp_test_SBJlI3LInAUFFp
RAZORPAY_KEY_SECRET=1pxn1a7tc9vKiOwQQ0D4Pt33
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay_dashboard
```

**Note**: The code has hardcoded fallback values for testing, but you should use environment variables in production.

### Webhook Setup in Razorpay Dashboard

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://api.musshk.com/api/payment/webhook`
3. Select events:
   - `payment.captured`
   - `payment.authorized`
   - `payment.failed`
4. Copy the webhook secret and add it to `.env` as `RAZORPAY_WEBHOOK_SECRET`

## Order Status Flow

### Order Statuses
- **Pending**: Order created, waiting for payment (Online) or processing (COD)
- **Processing**: Payment confirmed, order being prepared
- **Shipped**: Order shipped with tracking number
- **Delivered**: Order delivered to customer
- **Cancelled**: Order cancelled

### Payment Statuses
- **Pending**: Payment not yet received
- **Paid**: Payment successful
- **Failed**: Payment failed

## API Endpoints

### Frontend → Backend
- `POST /api/orders` - Create order
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment signature
- `GET /api/orders/user/:userId` - Get user orders
- `GET /api/orders/:id` - Get order details

### Razorpay → Backend (Webhook)
- `POST /api/payment/webhook` - Receive webhook events

## Admin Panel Features

The admin panel (`/admin/orders`) now includes:
- View all orders with payment details
- See payment IDs for online payments
- Update order status (Pending → Processing → Shipped → Delivered)
- Update payment status
- Add tracking numbers
- Filter orders by status
- View order statistics

## User Account Features

Users can now:
- View order history at `/account`
- See payment details including payment IDs
- Track order status
- View shipping addresses
- Access order details

## Testing

### Test Mode
The current setup uses Razorpay test keys. To test:
1. Use test card numbers from Razorpay documentation
2. Test successful payments
3. Test failed payments
4. Test payment cancellation

### Production Mode
1. Replace test keys with live keys
2. Update webhook URL to production URL
3. Test webhook events
4. Monitor payment logs

## Important Notes

1. **Order Creation**: Orders are created BEFORE payment to ensure order tracking even if payment fails
2. **Payment Verification**: Both frontend verification and webhook verification are implemented for reliability
3. **Status Updates**: Order status automatically changes to "Processing" when payment is confirmed
4. **Error Handling**: Failed payments update order status to "Failed" for tracking
5. **Webhook Security**: Webhook signature verification ensures only legitimate Razorpay events are processed

## Troubleshooting

### Payment Not Updating
- Check webhook URL is correct
- Verify webhook secret matches dashboard
- Check server logs for webhook events
- Verify order ID is passed correctly in payment notes

### Order Status Not Updating
- Check backend logs for errors
- Verify database connection
- Check order ID format

### Webhook Not Receiving Events
- Verify webhook URL is accessible from internet
- Check firewall settings
- Verify webhook secret in environment variables
- Test webhook endpoint manually
