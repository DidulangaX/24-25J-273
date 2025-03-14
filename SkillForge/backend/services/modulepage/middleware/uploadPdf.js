// middleware/uploadPdf.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/pdfs");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration for PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `pdf-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter for PDFs
const fileFilter = (req, file, cb) => {
  const fileTypes = /pdf/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Please upload a valid PDF file"));
  }
};

// Initialize upload middleware
const uploadPdf = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB
  fileFilter: fileFilter,
});

module.exports = uploadPdf;
