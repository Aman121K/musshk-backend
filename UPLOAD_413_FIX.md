# Fix 413 Request Entity Too Large for image uploads

**413** usually comes from the **reverse proxy** (e.g. Nginx) or the **hosting platform**, not from the Node app. The proxy limits request body size (often 1MB by default), so uploads larger than that are rejected before they reach the API.

---

## Backend upload details (stored for reference)

### Env vars (from `env.template`)

| Variable | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | S3 access (required for direct-to-S3) |
| `AWS_SECRET_ACCESS_KEY` | S3 secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_BUCKET_NAME` | Bucket name |
| `AWS_S3_BASE_URL` | Base URL for objects, e.g. `https://bucket.s3.region.amazonaws.com` or CloudFront URL |

### Upload routes (`/api/upload`)

| Method | Path | Purpose |
|--------|------|---------|
| **GET** | `/presign?folder=...&filename=...&contentType=...` | Returns `{ uploadUrl, publicUrl }` for direct browser PUT to S3. No file through API → no 413. Used by admin when S3 is configured. |
| **POST** | `/image?folder=...` | Single file (field `image`). Uploads to S3 if configured, else local. Fallback when presign not available. |
| **POST** | `/images?folder=...` | Multiple files (field `images`, max 20). Same: S3 or local. |

**Allowed folders:** `banners`, `products`, `blogs`, `testimonials`, `discounts`, `marketplaces`, `uploads`.

**Limits (Multer):** 10MB per file. Allowed types: jpeg, jpg, png, gif, webp.

**Middleware order (in `index.js`):** `/api/upload` is registered **before** `express.json()` / `express.urlencoded()`, so the 1MB body limit does not apply to upload routes.

**Direct-to-S3 flow:** Admin calls presign → browser PUTs file to S3 → `publicUrl` is stored in DB. See `S3_DIRECT_UPLOAD.md` for bucket CORS and public read.

---

## 1. Nginx (most common)

If `api.musshk.com` is behind Nginx, add or update in your server block (or `http` block):

```nginx
client_max_body_size 10M;
```

Then reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Example server block:

```nginx
server {
    listen 80;
    server_name api.musshk.com;
    client_max_body_size 10M;   # allow uploads up to 10MB
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;   # optional: stream body to Node without buffering
    }
}
```

## 2. Other platforms

- **AWS ALB / API Gateway:** Increase the request body size limit in the load balancer / API stage if applicable.
- **Railway / Render / Heroku:** Check their docs for request size limits; many use Nginx or a similar proxy and may expose a way to set `client_max_body_size` or an equivalent.
- **Cloudflare:** By default Cloudflare allows up to 100MB; 413 is then usually from your origin (Nginx/Node). Fix the origin as above.

## 3. Backend (already done)

- Upload routes are registered **before** the Express body parser, so the 1MB JSON limit does not apply to `/api/upload`.
- Multer allows up to **10MB per file** in `routes/upload.js`.

After increasing the proxy/host limit (e.g. Nginx `client_max_body_size 10M`), retry the upload.
