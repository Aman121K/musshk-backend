# iThink Logistics Integration

Delivery partner integration for creating pickup requests, storing waybill numbers, and printing shipping labels and invoices.

## Environment variables (.env)

Use the staging credentials for testing:

```
ITHINK_ACCESS_TOKEN=5a7b40197cd919337501dd6e9a3aad9a
ITHINK_SECRET_KEY=2b54c373427be180d1899400eeb21aab
ITHINK_PICKUP_ADDRESS_ID=1293
ITHINK_RETURN_ADDRESS_ID=1293
ITHINK_API_BASE=https://pre-alpha.ithinklogistics.com/api_v3
```

For production, switch to production credentials and:

```
ITHINK_API_BASE=https://my.ithinklogistics.com/api_v3
```

Optional: default parcel dimensions (used when creating shipment)

- `ITHINK_DEFAULT_WEIGHT_KG` (default: 0.5)
- `ITHINK_DEFAULT_LENGTH_CM`, `ITHINK_DEFAULT_WIDTH_CM`, `ITHINK_DEFAULT_HEIGHT_CM` (default: 20, 15, 10)

## Flow

1. **Order created** (after successful payment or COD place order)  
   - Backend creates the order in DB.  
   - Then (async) calls iThink **Add Order** API to create a pickup/shipment.  
   - Response waybill and tracking URL are saved on the order (`trackingNumber`, `trackingUrl`, `ithinkRefNum`).

2. **Admin – Orders**  
   - **Waybill** is shown in order details (and in the table when present).  
   - **Print shipping label**: calls backend `GET /api/orders/:id/shipping-label`, which uses iThink **Print Label** API and returns the PDF URL; admin opens it in a new tab to print and stick on the box.  
   - **Print invoice (packing slip)**: calls `GET /api/orders/:id/invoice`; backend returns HTML with order + delivery details; admin opens it in a new window and can print to put inside the box.

3. **Customer tracking**  
   - Order’s `trackingNumber` (waybill) and `trackingUrl` are shown in account order details and can be used on the Track Order page.

## API references

- Add order (create shipment): https://docs.ithinklogistics.com/doc-add-order  
- Print shipment label: https://docs.ithinklogistics.com/doc-print-shipment/3  
- General: https://docs.ithinklogistics.com/index/3  

## Troubleshooting

- **Waybill not set on order**  
  - Check `.env`: `ITHINK_ACCESS_TOKEN`, `ITHINK_SECRET_KEY`, `ITHINK_PICKUP_ADDRESS_ID`.  
  - Check backend logs for "iThink create shipment failed" or "iThink shipment created for order ...".

- **Live dummy order failed with warehouse phone error**  
  - Example: `orderNumber: DUMMY1772456302587`  
  - Error: `Delhivery Logistics Error : Warehouse Creation Failed - phone: phone must be a string`  
  - Meaning: request reached iThink, but the pickup warehouse profile linked to `ITHINK_PICKUP_ADDRESS_ID` (for example `1293`) is invalid in iThink/Delhivery.  
  - Fix in iThink dashboard: edit pickup/warehouse phone to a valid string mobile format (10 digits, no malformed value), save, then retry order creation.

- **Print shipping label fails**  
  - Order must have `trackingNumber` (waybill).  
  - Ensure iThink credentials are correct and the waybill exists in iThink.

- **Invoice**  
  - Served by our backend (HTML); no iThink call.  
  - Use for packing slip with order and delivery details.
