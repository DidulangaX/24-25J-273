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

router.get("/", getAllResources);

router.get("/:difficultyLevel", getResources);

router.get("/video/:videoId", getResourcesForVideo);

router.get("/id/:id", getResourceById);

router.post("/", uploadPdf.single("pdf"), createResource);

router.put("/:id", uploadPdf.single("pdf"), updateResource);

router.delete("/:id", deleteResource);

module.exports = router;
