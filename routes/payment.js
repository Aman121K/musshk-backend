const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { sendOrderConfirmation } = require('../utils/email');
const { createShipment, isConfigured: ithinkConfigured } = require('../utils/ithinkLogistics');

// Use provided Razorpay keys or environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SBJlI3LInAUFFp';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '1pxn1a7tc9vKiOwQQ0D4Pt33';

// Initialize Razorpay (only if keys are provided)
let razorpay = null;

const initializeRazorpay = () => {
  if (!razorpay && (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET)) {
    razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    // Check if Razorpay is configured
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      return res.status(500).json({ 
        error: 'Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.' 
      });
    }

    const { amount, currency = 'INR', receipt, notes, cartId, orderData } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Store order data in notes for webhook (if provided)
    const paymentNotes = {
      ...notes,
      cartId: cartId || notes?.cartId,
    };

    // If orderData is provided, store it in notes for webhook
    if (orderData) {
      paymentNotes.orderData = JSON.stringify(orderData);
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: paymentNotes,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Update cart with Razorpay order ID (if cartId provided)
    if (cartId) {
      try {
        await Cart.findByIdAndUpdate(cartId, {
          razorpayOrderId: razorpayOrder.id,
        });
      } catch (err) {
        console.error('Error updating cart:', err);
        // Don't fail if cart update fails
      }
    }

    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment order' });
  }
});

// Create order directly from order data
const createOrderFromData = async (orderData, payment) => {
  try {
    const orderNumber = generateOrderNumber();
    
    const order = new Order({
      orderNumber,
      user: orderData.user || null,
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      email: orderData.email || orderData.shippingAddress?.email,
      shippingAddress: orderData.shippingAddress || {},
      paymentMethod: orderData.paymentMethod || 'Online',
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      paymentDetails: {
        razorpay_order_id: payment.order_id,
        razorpay_payment_id: payment.id,
        razorpay_payment_method: payment.method || '',
        razorpay_bank: payment.bank || '',
        razorpay_wallet: payment.wallet || '',
        razorpay_vpa: payment.vpa || '',
        razorpay_contact: payment.contact || '',
        razorpay_email: payment.email || '',
        razorpay_fee: payment.fee ? payment.fee / 100 : 0,
        razorpay_tax: payment.tax ? payment.tax / 100 : 0,
        razorpay_created_at: payment.created_at ? new Date(payment.created_at * 1000) : new Date(),
      },
    });

    await order.save();

    // Send confirmation email
    try {
      await sendOrderConfirmation(order, null);
      console.log(`Order confirmation email sent to ${order.email}`);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
    }

    // Create shipment at iThink Logistics (async, don't block)
    if (ithinkConfigured()) {
      createShipment(order)
        .then((result) => {
          if (result && result.waybill) {
            return Order.findByIdAndUpdate(order._id, {
              trackingNumber: result.waybill,
              trackingUrl: result.tracking_url || undefined,
              ithinkRefNum: result.refnum || undefined,
            });
          }
        })
        .then(() => console.log(`iThink shipment created for order ${order.orderNumber}`))
        .catch((err) => console.error('iThink create shipment failed:', err));
    }

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Verify payment signature (frontend verification - webhook is primary)
router.post('/verify-payment', async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        error: 'Payment gateway not configured. Please set RAZORPAY_KEY_SECRET in environment variables.' 
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartId, orderData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Fetch payment details from Razorpay
    const razorpayInstance = initializeRazorpay();
    let payment = null;
    try {
      payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      return res.status(500).json({ error: 'Failed to fetch payment details' });
    }

    // Create order directly from orderData if provided
    if (orderData) {
      const order = await createOrderFromData(orderData, payment);
      return res.json({
        success: true,
        message: 'Payment verified successfully and order created',
        payment_id: razorpay_payment_id,
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    // Convert cart to order if cartId provided (backward compatibility)
    if (cartId) {
      try {
        const cart = await Cart.findById(cartId).populate('user', 'name email');
        
        if (cart && cart.status === 'pending') {
          // Convert cart to order
          const order = await convertCartToOrder(cart, payment);
          
          return res.json({
            success: true,
            message: 'Payment verified successfully and order created',
            payment_id: razorpay_payment_id,
            orderId: order._id,
            orderNumber: order.orderNumber,
          });
        } else if (cart && cart.status === 'converted') {
          // Cart already converted, return existing order
          const order = await Order.findById(cart.orderId);
          return res.json({
            success: true,
            message: 'Payment verified successfully',
            payment_id: razorpay_payment_id,
            orderId: order._id,
            orderNumber: order.orderNumber,
          });
        }
      } catch (err) {
        console.error('Error processing cart:', err);
        // Continue to return success even if cart processing fails
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});

// Generate order number
const generateOrderNumber = () => {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Convert cart to order
const convertCartToOrder = async (cart, payment) => {
  try {
    const orderNumber = generateOrderNumber();
    
    const orderData = {
      orderNumber,
      user: cart.user,
      items: cart.items.map(item => ({
        product: item.productId,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: cart.total,
      email: cart.shippingAddress.email,
      shippingAddress: cart.shippingAddress,
      paymentMethod: cart.paymentMethod || 'Online',
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      paymentDetails: {
        razorpay_order_id: payment.order_id,
        razorpay_payment_id: payment.id,
        razorpay_payment_method: payment.method || '',
        razorpay_bank: payment.bank || '',
        razorpay_wallet: payment.wallet || '',
        razorpay_vpa: payment.vpa || '',
        razorpay_contact: payment.contact || '',
        razorpay_email: payment.email || '',
        razorpay_fee: payment.fee ? payment.fee / 100 : 0,
        razorpay_tax: payment.tax ? payment.tax / 100 : 0,
        razorpay_created_at: payment.created_at ? new Date(payment.created_at * 1000) : new Date(),
      },
    };

    const order = new Order(orderData);
    await order.save();

    // Update cart status to converted
    cart.status = 'converted';
    cart.orderId = order._id;
    await cart.save();

    // Send confirmation email
    try {
      await sendOrderConfirmation(order, null);
      console.log(`Order confirmation email sent to ${order.email}`);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Don't fail the webhook if email fails
    }

    // Create shipment at iThink Logistics (async)
    if (ithinkConfigured()) {
      createShipment(order)
        .then((result) => {
          if (result && result.waybill) {
            return Order.findByIdAndUpdate(order._id, {
              trackingNumber: result.waybill,
              trackingUrl: result.tracking_url || undefined,
              ithinkRefNum: result.refnum || undefined,
            });
          }
        })
        .then(() => console.log(`iThink shipment created for order ${order.orderNumber}`))
        .catch((err) => console.error('iThink create shipment failed:', err));
    }

    return order;
  } catch (error) {
    console.error('Error converting cart to order:', error);
    throw error;
  }
};

// Razorpay Webhook Handler
// Note: This route is handled in index.js with raw body middleware
router.post('/webhook', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature
    const text = req.body.toString();
    const generated_signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generated_signature !== webhookSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(text);
    console.log('Razorpay Webhook Event:', event.event);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const cartId = payment.notes?.cartId;
      const orderDataStr = payment.notes?.orderData;

      // Create order directly from orderData if provided
      if (orderDataStr) {
        try {
          const orderData = JSON.parse(orderDataStr);
          const order = await createOrderFromData(orderData, payment);
          console.log(`Order ${order.orderNumber} created via webhook from orderData`);
        } catch (err) {
          console.error('Error creating order from orderData:', err);
        }
      }
      // Convert cart to order if cartId provided (backward compatibility)
      else if (cartId) {
        try {
          const cart = await Cart.findById(cartId).populate('user', 'name email');
          
          if (cart && cart.status === 'pending') {
            // Convert cart to order
            const order = await convertCartToOrder(cart, payment);
            console.log(`Cart ${cartId} converted to order ${order.orderNumber} via webhook`);
          } else if (cart && cart.status === 'converted') {
            // Cart already converted, just update payment details if needed
            const order = await Order.findById(cart.orderId);
            if (order && order.paymentStatus !== 'Paid') {
              await Order.findByIdAndUpdate(cart.orderId, {
                paymentStatus: 'Paid',
                orderStatus: 'Processing',
                'paymentDetails.razorpay_order_id': payment.order_id,
                'paymentDetails.razorpay_payment_id': payment.id,
                'paymentDetails.razorpay_payment_method': payment.method || '',
                'paymentDetails.razorpay_bank': payment.bank || '',
                'paymentDetails.razorpay_wallet': payment.wallet || '',
                'paymentDetails.razorpay_vpa': payment.vpa || '',
                'paymentDetails.razorpay_contact': payment.contact || '',
                'paymentDetails.razorpay_email': payment.email || '',
                'paymentDetails.razorpay_fee': payment.fee ? payment.fee / 100 : 0,
                'paymentDetails.razorpay_tax': payment.tax ? payment.tax / 100 : 0,
                'paymentDetails.razorpay_created_at': payment.created_at ? new Date(payment.created_at * 1000) : new Date(),
              });
              
              // Send email if not sent before
              try {
                await sendOrderConfirmation(order, null);
              } catch (emailError) {
                console.error('Error sending email:', emailError);
              }
            }
          }
        } catch (err) {
          console.error('Error processing cart in webhook:', err);
        }
      }
    }
    // Handle payment.failed event
    else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const cartId = payment.notes?.cartId;

      if (cartId) {
        const cart = await Cart.findById(cartId);
        if (cart && cart.status === 'pending') {
          // Keep cart as pending for potential discount campaigns
          // Just log the failure
          console.log(`Payment failed for cart ${cartId}`);
        }
      }
    }
    // Handle payment.authorized event (for manual capture)
    else if (event.event === 'payment.authorized') {
      const payment = event.payload.payment.entity;
      const cartId = payment.notes?.cartId;
      const orderDataStr = payment.notes?.orderData;

      // Create order directly from orderData if provided
      if (orderDataStr) {
        try {
          const orderData = JSON.parse(orderDataStr);
          const order = await createOrderFromData(orderData, payment);
          console.log(`Order ${order.orderNumber} created via webhook (authorized) from orderData`);
        } catch (err) {
          console.error('Error creating order from orderData:', err);
        }
      }
      // Convert cart to order if cartId provided (backward compatibility)
      else if (cartId) {
        try {
          const cart = await Cart.findById(cartId).populate('user', 'name email');
          
          if (cart && cart.status === 'pending') {
            // Convert cart to order
            const order = await convertCartToOrder(cart, payment);
            console.log(`Cart ${cartId} converted to order ${order.orderNumber} via webhook (authorized)`);
          }
        } catch (err) {
          console.error('Error processing cart in webhook:', err);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

