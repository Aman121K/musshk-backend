const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToS3, deleteLocalFile, isS3Configured } = require('../utils/s3');

// Ensure uploads directory exists (temporary storage before S3 upload, or permanent if S3 not configured)
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Helper function to determine folder based on query parameter or default
function getFolder(req) {
  const folder = req.query.folder || req.body.folder || 'uploads';
  // Validate folder name (security: only allow specific folders)
  const allowedFolders = ['banners', 'products', 'blogs', 'testimonials', 'discounts', 'uploads'];
  return allowedFolders.includes(folder) ? folder : 'uploads';
}

// Upload single image to S3 or local storage
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = getFolder(req);
    const filePath = req.file.path;
    let fileUrl;

    // Try to upload to S3 if configured, otherwise use local storage
    if (isS3Configured()) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        fileUrl = await uploadToS3(
          fileBuffer,
          req.file.originalname,
          folder,
          req.file.mimetype
        );
        // Delete local file after successful S3 upload
        deleteLocalFile(filePath);
      } catch (s3Error) {
        console.error('S3 upload failed, falling back to local storage:', s3Error);
        // Fall back to local storage
        fileUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      // Use local storage
      fileUrl = `/uploads/${req.file.filename}`;
    }

    res.json({
      success: true,
      url: fileUrl,
      filename: path.basename(fileUrl),
      folder: folder,
      storage: isS3Configured() ? 's3' : 'local',
    });
  } catch (error) {
    // Clean up local file on error
    if (req.file && req.file.path) {
      deleteLocalFile(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple images to S3 or local storage
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const folder = getFolder(req);
    const uploadedFiles = [];

    // Upload each file to S3 or local storage
    for (const file of req.files) {
      try {
        const filePath = file.path;
        let fileUrl;

        if (isS3Configured()) {
          try {
            const fileBuffer = fs.readFileSync(filePath);
            fileUrl = await uploadToS3(
              fileBuffer,
              file.originalname,
              folder,
              file.mimetype
            );
            // Delete local file after successful S3 upload
            deleteLocalFile(filePath);
          } catch (s3Error) {
            console.error(`S3 upload failed for ${file.originalname}, using local storage:`, s3Error);
            // Fall back to local storage
            fileUrl = `/uploads/${file.filename}`;
          }
        } else {
          // Use local storage
          fileUrl = `/uploads/${file.filename}`;
        }

        uploadedFiles.push({
          url: fileUrl,
          filename: path.basename(fileUrl),
        });
      } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error);
        // Clean up local file on error
        deleteLocalFile(file.path);
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ error: 'Failed to upload any files' });
    }

    res.json({
      success: true,
      files: uploadedFiles,
      folder: folder,
      storage: isS3Configured() ? 's3' : 'local',
    });
  } catch (error) {
    // Clean up all local files on error
    if (req.files) {
      req.files.forEach(file => {
        deleteLocalFile(file.path);
      });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

