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

// 🆕 INTERVENTION FEEDBACK ROUTES
router.post(
  "/intervention-feedback",
  videoController.handleInterventionFeedback
);
router.get(
  "/intervention-analytics/:videoId/:userId",
  videoController.getInterventionAnalytics
);

// 🆕 REAL-TIME INTERVENTION MONITORING (Optional - for admin dashboard)
router.get("/admin/recent-interventions", async (req, res) => {
  try {
    // Get recent intervention feedback across all users (last 24 hours)
    const recentInterventions = await UserInteraction.find({
      interventionFeedback: { $exists: true, $ne: [] },
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .select("userId videoId interventionFeedback updatedAt")
      .populate("videoId", "title")
      .limit(50)
      .sort({ updatedAt: -1 })
      .lean();

    // Flatten intervention feedback with context
    const flattenedInterventions = [];
    recentInterventions.forEach((interaction) => {
      if (
        interaction.interventionFeedback &&
        interaction.interventionFeedback.length > 0
      ) {
        interaction.interventionFeedback.forEach((feedback) => {
          flattenedInterventions.push({
            ...feedback,
            userId: interaction.userId,
            videoId: interaction.videoId,
            videoTitle: interaction.videoId?.title || "Unknown Video",
          });
        });
      }
    });

    // Sort by timestamp
    flattenedInterventions.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Identify struggling users (multiple help requests in 24h)
    const strugglingUsers = {};
    flattenedInterventions.forEach((intervention) => {
      if (intervention.needsHelp) {
        const key = `${intervention.userId}_${intervention.videoId}`;
        if (!strugglingUsers[key]) {
          strugglingUsers[key] = {
            userId: intervention.userId,
            videoId: intervention.videoId,
            videoTitle: intervention.videoTitle,
            helpRequestCount: 0,
            lastHelpRequest: null,
            reasons: [],
          };
        }
        strugglingUsers[key].helpRequestCount++;
        strugglingUsers[key].lastHelpRequest = intervention.timestamp;
        strugglingUsers[key].reasons.push(intervention.reason);
      }
    });

    // Filter to users with 2+ help requests
    const strugglingUsersList = Object.values(strugglingUsers)
      .filter((user) => user.helpRequestCount >= 2)
      .sort((a, b) => b.helpRequestCount - a.helpRequestCount);

    res.json({
      success: true,
      recentFeedback: flattenedInterventions.slice(0, 20), // Last 20 interventions
      strugglingUsers: strugglingUsersList,
      summary: {
        totalInterventions: flattenedInterventions.length,
        helpRequests: flattenedInterventions.filter((i) => i.needsHelp).length,
        strugglingUserCount: strugglingUsersList.length,
      },
    });
  } catch (error) {
    console.error("Error fetching recent interventions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent interventions",
    });
  }
});

// 🆕 INTERVENTION SUMMARY FOR SPECIFIC VIDEO
router.get("/intervention-summary/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;

    // Get all interventions for this video
    const interactions = await UserInteraction.find({
      videoId,
      interventionFeedback: { $exists: true, $ne: [] },
    })
      .select("userId interventionFeedback engagementMetrics")
      .lean();

    if (interactions.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalUsers: 0,
          totalInterventions: 0,
          helpRequests: 0,
          contentDifficulty: "unknown",
          commonIssues: [],
          recommendations: [],
        },
      });
    }

    // Analyze all interventions for this video
    let totalInterventions = 0;
    let helpRequests = 0;
    const reasonCounts = {};
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    const interventionTypeCounts = {};

    interactions.forEach((interaction) => {
      interaction.interventionFeedback.forEach((feedback) => {
        totalInterventions++;

        if (feedback.needsHelp) helpRequests++;

        // Count reasons
        reasonCounts[feedback.reason] =
          (reasonCounts[feedback.reason] || 0) + 1;

        // Count difficulty levels
        if (feedback.difficulty) {
          difficultyCounts[feedback.difficulty]++;
        }

        // Count intervention types
        interventionTypeCounts[feedback.interventionType] =
          (interventionTypeCounts[feedback.interventionType] || 0) + 1;
      });
    });

    // Determine content difficulty level
    const totalDifficultyReports =
      difficultyCounts.easy + difficultyCounts.medium + difficultyCounts.hard;
    let contentDifficulty = "appropriate";
    if (totalDifficultyReports > 0) {
      const hardRatio = difficultyCounts.hard / totalDifficultyReports;
      const easyRatio = difficultyCounts.easy / totalDifficultyReports;

      if (hardRatio > 0.6) contentDifficulty = "too_hard";
      else if (easyRatio > 0.6) contentDifficulty = "too_easy";
    }

    // Identify common issues
    const commonIssues = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));

    // Generate recommendations
    const recommendations = [];
    if (interventionTypeCounts.tabSwitch > interventionTypeCounts.pause) {
      recommendations.push(
        "Consider adding more explanatory content or examples"
      );
    }
    if (
      difficultyCounts.hard >
      difficultyCounts.easy + difficultyCounts.medium
    ) {
      recommendations.push(
        "Content may be too advanced - consider prerequisite materials"
      );
    }
    if (reasonCounts.confused > totalInterventions * 0.3) {
      recommendations.push(
        "Add clearer explanations or break down complex concepts"
      );
    }
    if (reasonCounts.too_fast > totalInterventions * 0.2) {
      recommendations.push(
        "Consider slower pacing or more detailed explanations"
      );
    }

    const summary = {
      totalUsers: interactions.length,
      totalInterventions,
      helpRequests,
      contentDifficulty,
      commonIssues,
      recommendations,
      breakdowns: {
        byReason: reasonCounts,
        byDifficulty: difficultyCounts,
        byType: interventionTypeCounts,
      },
    };

    console.log(`📊 Generated intervention summary for video ${videoId}:`, {
      users: summary.totalUsers,
      interventions: summary.totalInterventions,
      difficulty: summary.contentDifficulty,
    });

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error generating intervention summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate intervention summary",
    });
  }
});

// Catch-all route for debugging
router.get("*", (req, res, next) => {
  console.log("Route hit:", req.path);
  next();
});

module.exports = router;
