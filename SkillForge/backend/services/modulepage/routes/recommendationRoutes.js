// routes/recommendationRoutes.js
const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

// Get personalized recommendations
router.post(
  "/:videoId/personalized",
  recommendationController.getPersonalizedRecommendations
);

// Submit feedback and get recommendations
router.post(
  "/feedback",
  recommendationController.submitFeedbackAndGetRecommendations
);

module.exports = router;
