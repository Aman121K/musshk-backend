# Environment Variables Setup

## Required Environment Variables

Add these to your `.env` file in the backend directory:

### AWS S3 Configuration (for image uploads)
```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_BASE_URL=https://your-bucket-name.s3.us-east-1.amazonaws.com
```

### MongoDB Configuration
```env
MONGODB_URI=mongodb://localhost:27018/musk
```

### JWT Secret
```env
JWT_SECRET=your-secret-key-change-in-production
```

### Server Port
```env
PORT=5000
```

## S3 Setup Instructions

1. **Create an S3 Bucket:**
   - Go to AWS S3 Console
   - Create a new bucket
   - Enable public read access for uploaded images (or use CloudFront CDN)
   - Configure CORS if needed

2. **Create IAM User:**
   - Create an IAM user with programmatic access
   - Attach policy with S3 permissions:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "s3:PutObject",
             "s3:GetObject",
             "s3:DeleteObject"
           ],
           "Resource": "arn:aws:s3:::your-bucket-name/*"
         }
       ]
     }
     ```
   - Save the Access Key ID and Secret Access Key

3. **Update .env file** with your AWS credentials

## Image Upload Flow

1. Image is uploaded to temporary local storage (`/uploads` folder)
2. Image is uploaded to S3 in the specified folder (banners, products, blogs, testimonials, discounts)
3. Local file is automatically deleted after successful S3 upload
4. S3 URL is returned and stored in the database

## API Endpoints for Image Upload

### Single Image Upload
```
POST /api/upload/image?folder=banners
Content-Type: multipart/form-data
Body: image (file)
```

### Multiple Images Upload
```
POST /api/upload/images?folder=products
Content-Type: multipart/form-data
Body: images (files array)
```

### Available Folders
- `banners` - For banner images
- `products` - For product images
- `blogs` - For blog images
- `testimonials` - For testimonial images
- `discounts` - For discount banner images
- `uploads` - Default folder

