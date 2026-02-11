# Direct-to-S3 upload from admin

The admin panel uploads product (and other) images **directly to your S3 bucket** using presigned URLs. The API never receives the file, so you avoid 413 and proxy size limits. The S3 URL is then stored in the database.

## Flow

1. Admin selects image(s) → frontend asks API for a **presigned PUT URL** (`GET /api/upload/presign?folder=products&filename=...&contentType=...`).
2. API returns `{ uploadUrl, publicUrl }` (signed URL + final object URL).
3. Browser **PUTs the file** to `uploadUrl` (directly to S3).
4. Frontend adds `publicUrl` to the product’s images and saves the product; **DB stores the S3 URL**.

## Backend requirements

- Env: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, and optionally `AWS_REGION`, `AWS_S3_BASE_URL`.
- If S3 is not configured, the admin falls back to uploading via `POST /api/upload/image` (file goes through the API).

## S3 bucket setup

1. **Public read**  
   So the website can show images. Either:
   - Bucket policy that allows `s3:GetObject` public, or
   - CloudFront in front of the bucket and use CloudFront URL as `AWS_S3_BASE_URL`.

2. **CORS**  
   The browser sends a PUT from the admin origin (e.g. `https://admin.musshk.com` or `http://localhost:3001`). Add CORS to the bucket, e.g.:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedOrigins": ["https://admin.musshk.com", "http://localhost:3001"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

   In AWS Console: Bucket → Permissions → CORS.

3. **Block public access**  
   If you use a bucket policy for public read, ensure “Block public access” is set so that only the policy grants read (not “block all”).

After this, admin uploads go straight to S3 and the stored URL is the S3 (or CloudFront) URL used on the site.
