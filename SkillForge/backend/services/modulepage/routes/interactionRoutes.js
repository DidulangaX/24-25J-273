// routes/interactionRoutes.js
const express = require("express");
const router = express.Router();
const {
  recordInteraction,
  recordUserFeedback,
} = require("../controllers/userInteractionController");
const UserInteraction = require("../models/UserInteraction");

// Existing routes
router.post("/record", recordInteraction);
router.post("/feedback", recordUserFeedback);

// New route to check if user has already submitted feedback
router.get("/feedback-status", async (req, res) => {
  try {
    const { videoId, userId } = req.query;

    if (!videoId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing videoId or userId",
      });
    }

    // Check if user has already submitted feedback
    const interaction = await UserInteraction.findOne({
      videoId,
      userId,
      userFeedback: { $exists: true, $ne: "" },
    });

    return res.json({
      success: true,
      hasFeedback: !!interaction,
      feedback: interaction
        ? {
            difficulty: interaction.userFeedback,
            comments: interaction.comments || "",
            submittedAt: interaction.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking feedback status:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking feedback status",
      error: error.message,
    });
  }
});

module.exports = router;
