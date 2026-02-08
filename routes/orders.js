const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { sendOrderConfirmation } = require('../utils/email');
const { createShipment, getShippingLabelUrl, isConfigured: ithinkConfigured } = require('../utils/ithinkLogistics');

// Generate order number
const generateOrderNumber = () => {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Create order
router.post('/', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      orderNumber: generateOrderNumber(),
      orderStatus: req.body.paymentMethod === 'COD' ? 'Processing' : 'Pending',
    };
    const order = new Order(orderData);
    await order.save();

    sendOrderConfirmation(order, null).catch(err => {
      console.error('Failed to send email:', err);
    });

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

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shipping label PDF URL (iThink) for an order - admin can print and stick on box
router.get('/:id/shipping-label', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.trackingNumber) {
      return res.status(400).json({ error: 'No waybill yet. Shipment may still be creating or iThink is not configured.' });
    }
    const { file_name } = await getShippingLabelUrl(order.trackingNumber, req.query.page_size || 'A4');
    res.json({ url: file_name, waybill: order.trackingNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get printable invoice HTML for an order - full details to put in box
router.get('/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const addr = order.shippingAddress || {};
    const itemsHtml = (order.items || []).map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${(item.name || 'Item').replace(/</g, '&lt;')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.size || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${Number(item.price).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:20px auto;padding:20px">
      <h1 style="color:#5e2751">Musshk</h1>
      <h2>Order Invoice #${order.orderNumber}</h2>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod} | ${order.paymentStatus}</p>
      ${order.trackingNumber ? `<p><strong>Waybill (AWB):</strong> ${order.trackingNumber}</p>` : ''}
      <h3>Delivery Address</h3>
      <p>${(addr.name || '').replace(/</g, '&lt;')}<br>${(addr.address || '').replace(/</g, '&lt;')}<br>${(addr.city || '')}, ${(addr.state || '')} ${(addr.pincode || '')}<br>${(addr.country || '')}<br>Phone: ${addr.phone || ''}</p>
      <h3>Items</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Product</th><th style="padding:8px">Size</th><th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Price</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="4" style="padding:8px;text-align:right;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">Rs. ${Number(order.totalAmount).toFixed(2)}</td></tr></tfoot>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#666">Thank you for shopping with Musshk.</p>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

