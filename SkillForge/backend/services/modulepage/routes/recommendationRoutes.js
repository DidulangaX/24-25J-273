const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

router.post(
  "/:videoId/personalized",
  recommendationController.getPersonalizedRecommendations
);

router.post(
  "/feedback",
  recommendationController.submitFeedbackAndGetRecommendations
);

module.exports = router;
