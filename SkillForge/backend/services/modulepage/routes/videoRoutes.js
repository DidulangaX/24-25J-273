const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");
const upload = require("../middleware/upload");
const uploadPdf = require("../middleware/uploadPdf");
const resourceController = require("../controllers/resourceController");

// Video routes
router.get("/", videoController.getVideos);
router.get("/stream/:id", videoController.streamVideo);
router.get("/:id", videoController.getVideoById);
router.post("/", upload.single("video"), videoController.createVideo);
router.put("/:id", upload.single("video"), videoController.updateVideo);
router.delete("/:id", videoController.deleteVideo);

// Recommendations routes
router.get("/:videoId/recommendations", videoController.getRecommendations);
router.get(
  "/model-recommendations/:videoId",
  videoController.getModelRecommendations
);

// Session management routes
router.post("/clear-session", videoController.clearSession);
router.post("/end-session", videoController.endSession);

// Interaction tracking routes
router.post("/interaction", videoController.trackInteraction);

// Difficulty detection routes
router.post("/detect-difficulty/:videoId", videoController.detectDifficulty);
router.post("/difficulty-feedback", videoController.submitDifficultyFeedback);

// Additional tracking routes
router.post("/tab-switch-feedback", videoController.recordTabSwitchFeedback);
router.post("/insights/:videoId", videoController.generateInsights);

// User session routes
router.get("/user-sessions/:userId", videoController.getUserSessions);
router.get("/sequence/:sequenceId", videoController.getSequenceVideos);

// Resource routes (if you want them under /api/videos/resources)
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

// Catch-all route for debugging
router.get("*", (req, res, next) => {
  console.log("Route hit:", req.path);
  next();
});

module.exports = router;
