const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");
const upload = require("../middleware/upload");
const uploadPdf = require("../middleware/uploadPdf");
const resourceController = require("../controllers/resourceController");

router.get("/:videoId/recommendations", videoController.getRecommendations);

router.post("/", upload.single("video"), videoController.createVideo);
router.post("/clear-session", videoController.clearSession);

router.get("/", videoController.getVideos);
router.get("/stream/:id", videoController.streamVideo);
router.put("/:id", upload.single("video"), videoController.updateVideo);

router.delete("/:id", videoController.deleteVideo);

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

router.post("/interaction", videoController.trackInteraction);

router.get("/difficulty/:videoId", videoController.getDifficulty);
router.post("/difficulty-feedback", videoController.submitDifficultyFeedback);

router.post("/detect-difficulty/:videoId", videoController.detectDifficulty);
router.get(
  "/model-recommendations/:videoId",
  videoController.getModelRecommendations
);
router.post("/insights/:videoId", videoController.generateInsights);

router.post("/end-session", videoController.endSession);

router.get("/:id", videoController.getVideoById);

router.get("*", (req, res, next) => {
  console.log("Route hit:", req.path);
  next();
});

module.exports = router;
