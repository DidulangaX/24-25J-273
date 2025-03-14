const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");
const upload = require("../middleware/upload");
const uploadPdf = require("../middleware/uploadPdf");
const resourceController = require("../controllers/resourceController");

// Route for recommendations
router.get("/:videoId/recommendations", videoController.getRecommendations);

// Upload new video route
router.post("/", upload.single("video"), videoController.createVideo);

// Basic video routes
router.get("/", videoController.getVideos);
router.get("/stream/:id", videoController.streamVideo);

router.get("/resources/:difficultyLevel", resourceController.getResources);
router.get(
  "/resources/video/:videoId",
  resourceController.getResourcesForVideo
);
router.post(
  "/resources",
  uploadPdf.single("pdf"),
  resourceController.createResource
);

// Interaction tracking
router.post("/interaction", videoController.trackInteraction);

// Difficulty detection routes
router.get("/difficulty/:videoId", videoController.getDifficulty);
router.post("/difficulty-feedback", videoController.submitDifficultyFeedback);

// New ML model routes
router.post("/detect-difficulty/:videoId", videoController.detectDifficulty);
router.get(
  "/model-recommendations/:videoId",
  videoController.getModelRecommendations
);
router.post("/insights/:videoId", videoController.generateInsights);

// Session management
router.post("/end-session", videoController.endSession);

// Get video by ID - keep at the bottom to avoid path conflicts
router.get("/:id", videoController.getVideoById);

// Debug route - keep as the last route
router.get("*", (req, res, next) => {
  console.log("Route hit:", req.path);
  next();
});

module.exports = router;
