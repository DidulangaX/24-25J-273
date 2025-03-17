// routes/resourceRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllResources,
  getResources,
  createResource,
  getResourcesForVideo,
  getResourceById,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");
const uploadPdf = require("../middleware/uploadPdf");

// Get ALL resources (needed for the dashboard)
router.get("/", getAllResources);

// Get all resources for a difficulty level
router.get("/:difficultyLevel", getResources);

// Get resources for a specific video
router.get("/video/:videoId", getResourcesForVideo);

// Get a single resource by ID
router.get("/id/:id", getResourceById);

// Create a new resource
router.post("/", uploadPdf.single("pdf"), createResource);

// Update a resource
router.put("/:id", uploadPdf.single("pdf"), updateResource);

// Delete a resource
router.delete("/:id", deleteResource);

module.exports = router;
