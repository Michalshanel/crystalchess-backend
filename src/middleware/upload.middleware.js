/**
 * Upload Middleware
 * File upload middleware using Multer
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config/environment");
const { UPLOAD_PATHS } = require("../config/constants");

// Ensure upload directories exist
Object.values(UPLOAD_PATHS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload path based on field name
    let uploadPath = UPLOAD_PATHS.DOCUMENTS;

    if (file.fieldname === "profilePicture") {
      uploadPath = UPLOAD_PATHS.PROFILES;
    } else if (file.fieldname === "eventImage") {
      uploadPath = UPLOAD_PATHS.EVENTS;
    } else if (file.fieldname === "rulesPdf") {
      uploadPath = UPLOAD_PATHS.RULES;
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter to validate file types
 */
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${config.upload.allowedTypes.join(
          ", "
        )}`
      ),
      false
    );
  }
};

/**
 * Multer upload configuration
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: fileFilter,
});

/**
 * Single file upload middleware
 * @param {string} fieldName - Name of the file input field
 */
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

/**
 * Multiple files upload middleware
 * @param {string} fieldName - Name of the file input field
 * @param {number} maxCount - Maximum number of files
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Upload multiple fields with different names
 */
const uploadFields = (fields) => {
  return upload.fields(fields);
};

/**
 * Delete file from filesystem
 * @param {string} filePath - Path to file
 */
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
};
