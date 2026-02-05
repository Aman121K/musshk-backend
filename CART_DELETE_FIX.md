# Cart Delete Item Fix

## Problem

The frontend was calling:
```
DELETE /api/cart/:sessionId/[object Object]
```

This happened because the frontend was passing an object instead of the `productId` string in the URL.

## Solution

I've updated the cart delete endpoint to handle this in two ways:

### Option 1: Use New Endpoint (Recommended)
```
DELETE /api/cart/:sessionId/item
Content-Type: application/json

Body:
{
  "productId": "696b7da75063db4a75c97dc6"
}
```

### Option 2: Use Existing Endpoint with productId in Body
```
DELETE /api/cart/:sessionId/[anything]
Content-Type: application/json

Body:
{
  "productId": "696b7da75063db4a75c97dc6"
}
```

The API will now:
- Accept `productId` in the request body
- Ignore invalid `itemId` in URL (like `[object Object]`)
- Use `productId` from body to find and remove the item

## Frontend Fix Required

Update your frontend code to send `productId` in the request body:

### Before (Broken):
```javascript
// ❌ This passes object in URL
const itemId = item; // item is an object
fetch(`/api/cart/${sessionId}/${itemId}`, {
  method: 'DELETE'
});
```

### After (Fixed - Option 1):
```javascript
// ✅ Use new endpoint with productId in body
fetch(`/api/cart/${sessionId}/item`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: item.productId // or item.productId.toString()
  })
});
```

### After (Fixed - Option 2):
```javascript
// ✅ Use existing endpoint with productId in body
const productId = item.productId || item.productId.toString();
fetch(`/api/cart/${sessionId}/remove`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: productId
  })
});
```

## API Response

### Success:
```json
{
  "message": "Item removed from cart",
  "cart": {
    "_id": "...",
    "sessionId": "...",
    "items": [...],
    "total": 0,
    "status": "active"
  }
}
```

### Error (Item not found):
```json
{
  "error": "Item not found in cart",
  "cart": {...}
}
```

### Error (Invalid request):
```json
{
  "error": "Invalid item identifier. Please provide productId in request body or use DELETE /:sessionId/item endpoint."
}
```

## Testing

Test with curl:

```bash
# Option 1: New endpoint
curl -X DELETE 'http://localhost:5000/api/cart/session_xxx/item' \
  -H 'Content-Type: application/json' \
  -d '{"productId": "696b7da75063db4a75c97dc6"}'

# Option 2: Existing endpoint with productId in body
curl -X DELETE 'http://localhost:5000/api/cart/session_xxx/anything' \
  -H 'Content-Type: application/json' \
  -d '{"productId": "696b7da75063db4a75c97dc6"}'
```

## Notes

- The API now accepts `productId` in the request body
- Invalid `itemId` in URL (like `[object Object]`) is ignored if `productId` is in body
- The new `/item` endpoint is cleaner and recommended for new code
- Both endpoints work the same way - they remove items by `productId`
