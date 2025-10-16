const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const createUploadsDirectory = async () => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadsDir = await createUploadsDirectory();
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `logo_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// Configure upload limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware for logo upload
const uploadLogo = upload.single('logo');

// Wrapper to handle multer errors
const handleLogoUpload = (req, res, next) => {
  uploadLogo(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 2MB.'
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "logo" as field name.'
        });
      }
    }
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next();
  });
};

// Helper function to delete old logo
const deleteOldLogo = async (logoPath) => {
  if (!logoPath) return;
  
  try {
    const fullPath = path.join(process.cwd(), 'public', logoPath);
    await fs.unlink(fullPath);
    console.log('🗑️ Deleted old logo:', logoPath);
  } catch (error) {
    console.warn('⚠️ Could not delete old logo:', error.message);
  }
};

module.exports = {
  handleLogoUpload,
  deleteOldLogo,
  createUploadsDirectory
};
