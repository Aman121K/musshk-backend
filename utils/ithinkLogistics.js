/**
 * iThink Logistics API integration
 * Docs: https://docs.ithinklogistics.com/index/3
 * Staging: https://pre-alpha.ithinklogistics.com/api_v3/
 */

const ITHINK_BASE = process.env.ITHINK_API_BASE || 'https://pre-alpha.ithinklogistics.com/api_v3';
const ACCESS_TOKEN = process.env.ITHINK_ACCESS_TOKEN || '';
const SECRET_KEY = process.env.ITHINK_SECRET_KEY || '';
const PICKUP_ADDRESS_ID = process.env.ITHINK_PICKUP_ADDRESS_ID || '1293';
const RETURN_ADDRESS_ID = process.env.ITHINK_RETURN_ADDRESS_ID || process.env.ITHINK_PICKUP_ADDRESS_ID || '1293';

const DEFAULT_WEIGHT_KG = parseFloat(process.env.ITHINK_DEFAULT_WEIGHT_KG || '0.5');
const DEFAULT_LENGTH_CM = parseFloat(process.env.ITHINK_DEFAULT_LENGTH_CM || '20');
const DEFAULT_WIDTH_CM = parseFloat(process.env.ITHINK_DEFAULT_WIDTH_CM || '15');
const DEFAULT_HEIGHT_CM = parseFloat(process.env.ITHINK_DEFAULT_HEIGHT_CM || '10');

function isConfigured() {
  return !!(ACCESS_TOKEN && SECRET_KEY && PICKUP_ADDRESS_ID);
}

/**
 * Build shipment payload for iThink add order API from our Order model
 */
function buildShipmentPayload(order) {
  const addr = order.shippingAddress || {};
  const isPrepaid = order.paymentMethod === 'Online';

  const products = (order.items || []).map((item, idx) => ({
    product_name: (item.name || 'Product').substring(0, 255),
    product_sku: `${order.orderNumber}-${idx + 1}`,
    product_quantity: Number(item.quantity) || 1,
    product_price: Number(item.price) || 0,
    product_tax_rate: 0,
    product_hsn_code: '33030000',
    product_discount: 0,
  }));

  if (products.length === 0) {
    products.push({
      product_name: 'Order items',
      product_sku: order.orderNumber,
      product_quantity: 1,
      product_price: Number(order.totalAmount) || 0,
      product_tax_rate: 0,
      product_hsn_code: '33030000',
      product_discount: 0,
    });
  }

  const shipment = {
    waybill: '',
    order: order.orderNumber,
    sub_order: '',
    order_date: (() => {
      const d = order.createdAt ? new Date(order.createdAt) : new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    })(),
    total_amount: String(Number(order.totalAmount).toFixed(2)),
    name: (addr.name || 'Customer').substring(0, 100),
    company_name: '',
    add: (addr.address || 'Address').substring(0, 200),
    add2: '',
    add3: '',
    pin: String(addr.pincode || '').replace(/\D/g, '').substring(0, 6) || '110001',
    city: (addr.city || '').substring(0, 50),
    state: (addr.state || '').substring(0, 50),
    country: (addr.country || 'India').substring(0, 50),
    phone: String(addr.phone || '').replace(/\D/g, '').substring(0, 15) || '9999999999',
    alt_phone: '',
    email: (order.email || addr.email || '').substring(0, 100),
    is_billing_same_as_shipping: 'yes',
    billing_name: (addr.name || 'Customer').substring(0, 100),
    billing_company_name: '',
    billing_add: (addr.address || 'Address').substring(0, 200),
    billing_add2: '',
    billing_add3: '',
    billing_pin: String(addr.pincode || '').replace(/\D/g, '').substring(0, 6) || '110001',
    billing_city: (addr.city || '').substring(0, 50),
    billing_state: (addr.state || '').substring(0, 50),
    billing_country: (addr.country || 'India').substring(0, 50),
    billing_phone: String(addr.phone || '').replace(/\D/g, '').substring(0, 15) || '9999999999',
    billing_alt_phone: '',
    billing_email: (order.email || '').substring(0, 100),
    products,
    shipment_length: String(DEFAULT_LENGTH_CM),
    shipment_width: String(DEFAULT_WIDTH_CM),
    shipment_height: String(DEFAULT_HEIGHT_CM),
    weight: String(DEFAULT_WEIGHT_KG),
    shipping_charges: '0',
    giftwrap_charges: '0',
    transaction_charges: '0',
    total_discount: '0',
    first_attemp_discount: '0',
    cod_charges: '0',
    advance_amount: isPrepaid ? String(Number(order.totalAmount).toFixed(2)) : '0',
    cod_amount: isPrepaid ? '0' : String(Number(order.totalAmount).toFixed(2)),
    payment_mode: isPrepaid ? 'Prepaid' : 'COD',
    reseller_name: '',
    eway_bill_number: '',
    gst_number: '',
    what3words: '',
    return_address_id: String(RETURN_ADDRESS_ID),
  };

  return {
    data: {
      shipments: [shipment],
      pickup_address_id: String(PICKUP_ADDRESS_ID),
      access_token: ACCESS_TOKEN,
      secret_key: SECRET_KEY,
      order_type: 'forward',
    },
  };
}

/**
 * Create shipment at iThink Logistics (pickup request). Returns { waybill, tracking_url, refnum } or throws.
 */
async function createShipment(order) {
  if (!isConfigured()) {
    console.warn('iThink Logistics not configured. Set ITHINK_ACCESS_TOKEN, ITHINK_SECRET_KEY, ITHINK_PICKUP_ADDRESS_ID.');
    return null;
  }

  const payload = buildShipmentPayload(order);
  const url = `${ITHINK_BASE}/order/add.json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (json.status !== 'success' && json.status_code !== 200) {
    const msg = json.html_message || json.message || JSON.stringify(json);
    throw new Error(`iThink create order failed: ${msg}`);
  }

  const data = json.data;
  const firstKey = data && typeof data === 'object' ? Object.keys(data)[0] : null;
  const first = firstKey ? data[firstKey] : null;

  if (!first || first.status !== 'Success') {
    const msg = (first && first.remark) || json.html_message || 'Unknown error';
    throw new Error(`iThink order failed: ${msg}`);
  }

  return {
    waybill: first.waybill || '',
    tracking_url: first.tracking_url || '',
    refnum: first.refnum || '',
    logistic_name: first.logistic_name || '',
  };
}

/**
 * Get shipping label PDF URL for given AWB (waybill) numbers. Comma-separated, max 100.
 * Returns { file_name: "https://..." } or throws.
 */
async function getShippingLabelUrl(awbNumbers, pageSize = 'A4') {
  if (!isConfigured()) {
    throw new Error('iThink Logistics not configured');
  }

  const awbStr = Array.isArray(awbNumbers) ? awbNumbers.join(',') : String(awbNumbers);
  if (!awbStr) throw new Error('AWB number(s) required');

  const url = `${ITHINK_BASE}/shipping/label.json`;
  const payload = {
    data: {
      access_token: ACCESS_TOKEN,
      secret_key: SECRET_KEY,
      awb_numbers: awbStr,
      page_size: pageSize,
      display_cod_prepaid: '1',
      display_shipper_mobile: '1',
      display_shipper_address: '1',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (json.status !== 'success' || !json.file_name) {
    const msg = json.html_message || json.message || JSON.stringify(json);
    throw new Error(`iThink label failed: ${msg}`);
  }

  return { file_name: json.file_name };
}

module.exports = {
  isConfigured,
  createShipment,
  getShippingLabelUrl,
  buildShipmentPayload,
};
