const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  // Prevent SDK from adding optional checksum params to presigned PUT URLs.
  // Those params can cause upload failures in browser direct-to-S3 flows.
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const S3_BASE_URL = process.env.AWS_S3_BASE_URL || `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;

/**
 * Check if S3 is configured
 * @returns {Boolean}
 */
function isS3Configured() {
  return !!(BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * Upload file to S3
 * @param {Buffer|Stream} fileBuffer - File buffer or stream
 * @param {String} fileName - File name
 * @param {String} folder - Folder path in S3 (e.g., 'products', 'banners', 'blogs', 'testimonials')
 * @param {String} contentType - MIME type
 * @returns {Promise<String>} S3 URL of uploaded file
 */
async function uploadToS3(fileBuffer, fileName, folder = 'uploads', contentType = 'image/jpeg') {
  try {
    if (!isS3Configured()) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }

    // Generate unique filename
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(fileName)}`;
    const key = `${folder}/${uniqueFileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // ACL: 'public-read', // Make file publicly accessible
    });

    await s3Client.send(command);

    // Return the S3 URL
    const s3Url = `${S3_BASE_URL}/${key}`;
    return s3Url;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

/**
 * Delete file from S3
 * @param {String} s3Url - Full S3 URL or key
 * @returns {Promise<Boolean>} Success status
 */
async function deleteFromS3(s3Url) {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }

    // Extract key from URL
    let key = s3Url;
    if (s3Url.includes(BUCKET_NAME)) {
      key = s3Url.split(`${BUCKET_NAME}/`)[1];
    } else if (s3Url.includes('amazonaws.com/')) {
      key = s3Url.split('amazonaws.com/')[1];
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
}

/**
 * Get a presigned PUT URL for direct browser upload to S3.
 * Client should PUT the file with the same Content-Type.
 * @param {String} folder - S3 folder (e.g. 'products', 'banners')
 * @param {String} fileName - Original or safe filename (will be made unique)
 * @param {String} contentType - MIME type (e.g. 'image/jpeg')
 * @param {Number} expiresIn - URL expiry in seconds (default 900)
 * @returns {Promise<{ uploadUrl: string, publicUrl: string }>}
 */
async function getPresignedPutUrl(folder = 'uploads', fileName, contentType = 'image/jpeg', expiresIn = 900) {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured');
  }
  const ext = path.extname(fileName) || '.jpg';
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
  const key = `${folder}/${uniqueName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = `${S3_BASE_URL}/${key}`;
  return { uploadUrl, publicUrl };
}

/**
 * Delete local file
 * @param {String} filePath - Local file path
 */
function deleteLocalFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted local file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting local file ${filePath}:`, error);
  }
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  deleteLocalFile,
  isS3Configured,
  getPresignedPutUrl,
  BUCKET_NAME,
  S3_BASE_URL,
};
