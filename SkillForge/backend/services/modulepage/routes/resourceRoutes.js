// routes/resourceRoutes.js - Add these endpoints
const express = require("express");
const router = express.Router();
const {
  getResources,
  createResource,
  getResourcesForVideo,
} = require("../controllers/resourceController");
const uploadPdf = require("../middleware/uploadPdf");

// Get all resources for a difficulty level
router.get("/:difficultyLevel", getResources);

// Get resources for a specific video
router.get("/video/:videoId", getResourcesForVideo);

// Create a new resource
router.post("/", uploadPdf.single("pdf"), createResource);

module.exports = router;
