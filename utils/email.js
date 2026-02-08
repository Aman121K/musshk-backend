const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use Gmail or any SMTP service
  // For production, use services like SendGrid, Mailgun, or AWS SES
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password',
    },
  });
};

// Send order confirmation email
const sendOrderConfirmation = async (order, orderDetails) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'Musshk <noreply@musshk.com>',
      to: order.email,
      subject: `Musshk - Order Confirmation #${order.orderNumber}`,
      html: generateOrderEmailHTML(order, orderDetails),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${order.email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Generate HTML email template
const generateOrderEmailHTML = (order, orderDetails) => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} ${item.size ? `(${item.size})` : ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #5e2751; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 18px; font-weight: bold; color: #5e2751; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Musshk</h1>
          <p>Order Confirmation</p>
        </div>
        <div class="content">
          <h2>Thank you for your order!</h2>
          <p>Dear ${order.shippingAddress.name},</p>
          <p>We have received your order and it's being processed. Your order details are below:</p>
          
          <div class="order-details">
            <h3>Order Information</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Order Status:</strong> ${order.orderStatus}</p>
          </div>

          <div class="order-details">
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;" class="total">Rs. ${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="order-details">
            <h3>Delivery Address</h3>
            <p>
              ${order.shippingAddress.name}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}<br>
              ${order.shippingAddress.country}
            </p>
            <p><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
          </div>

          <p>We'll send you another email when your order is shipped.</p>
          <p>If you have any questions, please contact us at Musshk09@gmail.com or call 97599 05151</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Musshk. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate invoice PDF (simplified - returns HTML for now)
const generateInvoice = (order) => {
  return generateOrderEmailHTML(order, null);
};

const getSiteUrl = () => process.env.SITE_URL || process.env.FRONTEND_URL || 'https://musshk.com';

const productEmailHTML = (product, productUrl) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #5e2751; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Musshk</h1>
        <p style="margin: 8px 0 0;">New arrival for you</p>
      </div>
      <div style="background: #f9f9f9; padding: 20px;">
        <h2 style="color: #5e2751;">A new product is here</h2>
        <p><strong>${product.name}</strong></p>
        ${product.shortDescription ? `<p>${product.shortDescription}</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${productUrl}" style="display: inline-block; background: #5e2751; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View product</a>
        </p>
      </div>
      <p style="text-align: center; color: #666; font-size: 12px;">&copy; ${new Date().getFullYear()} Musshk</p>
    </div>
  </body>
  </html>
`;

const blogEmailHTML = (blog, blogUrl) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #5e2751; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Musshk</h1>
        <p style="margin: 8px 0 0;">New from our blog</p>
      </div>
      <div style="background: #f9f9f9; padding: 20px;">
        <h2 style="color: #5e2751;">${blog.title}</h2>
        ${blog.excerpt ? `<p>${blog.excerpt}</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${blogUrl}" style="display: inline-block; background: #5e2751; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Read more</a>
        </p>
      </div>
      <p style="text-align: center; color: #666; font-size: 12px;">&copy; ${new Date().getFullYear()} Musshk</p>
    </div>
  </body>
  </html>
`;

const sendNewProductEmail = async (to, product) => {
  try {
    const base = getSiteUrl().replace(/\/$/, '');
    const productUrl = `${base}/products/${product.slug}`;
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Musshk <noreply@musshk.com>',
      to,
      subject: `Musshk – New product: ${product.name}`,
      html: productEmailHTML(product, productUrl),
    });
    return true;
  } catch (err) {
    console.error('Error sending new product email to', to, err);
    return false;
  }
};

const sendNewBlogEmail = async (to, blog) => {
  try {
    const base = getSiteUrl().replace(/\/$/, '');
    const blogUrl = `${base}/blog/${blog.slug}`;
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Musshk <noreply@musshk.com>',
      to,
      subject: `Musshk – New post: ${blog.title}`,
      html: blogEmailHTML(blog, blogUrl),
    });
    return true;
  } catch (err) {
    console.error('Error sending new blog email to', to, err);
    return false;
  }
};

const notifySubscribersNewProduct = async (product) => {
  const Subscriber = require('../models/Subscriber');
  try {
    const subscribers = await Subscriber.find({}).select('email').lean();
    for (const sub of subscribers) {
      sendNewProductEmail(sub.email, product).catch(() => {});
    }
    if (subscribers.length) console.log(`Notified ${subscribers.length} subscriber(s) about new product: ${product.name}`);
  } catch (err) {
    console.error('Error notifying subscribers of new product:', err);
  }
};

const notifySubscribersNewBlog = async (blog) => {
  const Subscriber = require('../models/Subscriber');
  try {
    const subscribers = await Subscriber.find({}).select('email').lean();
    for (const sub of subscribers) {
      sendNewBlogEmail(sub.email, blog).catch(() => {});
    }
    if (subscribers.length) console.log(`Notified ${subscribers.length} subscriber(s) about new blog: ${blog.title}`);
  } catch (err) {
    console.error('Error notifying subscribers of new blog:', err);
  }
};

module.exports = {
  sendOrderConfirmation,
  generateInvoice,
  sendNewProductEmail,
  sendNewBlogEmail,
  notifySubscribersNewProduct,
  notifySubscribersNewBlog,
  getSiteUrl,
};

