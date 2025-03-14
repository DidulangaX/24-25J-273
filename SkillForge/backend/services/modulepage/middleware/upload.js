const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration for videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `video-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter for videos
const fileFilter = (req, file, cb) => {
  const fileTypes = /mp4|avi|mov|wmv|flv|mkv/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Please upload a valid video file"));
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // 100MB
  fileFilter: fileFilter,
});

module.exports = upload;
