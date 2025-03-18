// controllers/recommendationController.js
const asyncHandler = require("express-async-handler");
const Video = require("../models/Video");
const Resource = require("../models/Resource");
const UserProfile = require("../models/UserProfile");
const UserInteraction = require("../models/UserInteraction");

/**
 * Get personalized recommendations based on user feedback and learning patterns
 * This is a sophisticated algorithm that tailors content based on difficulty feedback
 */
exports.getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { userId, difficulty } = req.body;

  if (!videoId) {
    return res.status(400).json({
      success: false,
      message: "Video ID is required",
    });
  }

  try {
    // 1. Get the current video details
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // 2. Get user profile to understand their learning history
    let userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      // Create a new profile if one doesn't exist
      userProfile = await UserProfile.create({
        userId,
        learningHistory: [],
        skillLevels: new Map(),
        preferences: {
          learningStyle: "undetermined",
          contentTypes: [],
          pacePreference: "medium",
        },
      });
    }

    // 3. Determine next steps based on difficulty feedback
    let nextSteps;
    if (difficulty === "difficult") {
      nextSteps = await getPathForDifficultContent(currentVideo, userProfile);
    } else if (difficulty === "easy") {
      nextSteps = await getPathForEasyContent(currentVideo, userProfile);
    } else {
      nextSteps = await getPathForJustRightContent(currentVideo, userProfile);
    }

    // 4. Update user's learning history
    await updateLearningHistory(userProfile, currentVideo, difficulty);

    // 5. Return personalized recommendations
    res.status(200).json({
      success: true,
      difficulty,
      recommendations: nextSteps,
    });
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Error generating recommendations",
      error: error.message,
    });
  }
});

/**
 * Get recommendations for users who found content difficult
 * Focus on providing fundamental resources and easier content
 */
async function getPathForDifficultContent(currentVideo, userProfile) {
  // For users struggling with content, provide:
  // 1. Simpler prerequisite videos
  // 2. Fundamentals resources
  // 3. More step-by-step guided content

  // Get easier videos in the same category
  const easierVideos = await Video.find({
    category: currentVideo.category,
    difficultyLevel: "beginner",
    _id: { $ne: currentVideo._id },
    level: { $lt: currentVideo.level || 3 },
  }).limit(3);

  // Get explanatory resources tagged as "easy"
  const supportResources = await Resource.find({
    recommendedFor: "easy",
    $or: [
      { tags: { $in: currentVideo.tags || [] } },
      { category: currentVideo.category },
    ],
  }).limit(4);

  // Find foundational videos related to the current topic
  const foundationalVideos = await Video.find({
    tags: { $in: currentVideo.tags || [] },
    difficultyLevel: "beginner",
  }).limit(2);

  // Craft a custom learning path focusing on fundamentals
  const learningPath = [
    ...easierVideos.map(formatVideoForResponse),
    ...foundationalVideos
      .filter(
        (v) =>
          !easierVideos.some((ev) => ev._id.toString() === v._id.toString())
      )
      .map(formatVideoForResponse),
  ].slice(0, 3); // Ensure we have at most 3 videos

  return {
    nextVideo:
      easierVideos.length > 0 ? formatVideoForResponse(easierVideos[0]) : null,
    resources: supportResources.map(formatResourceForResponse),
    learningPath,
    learningTips: [
      "Break down complex concepts into smaller parts",
      "Focus on understanding fundamental principles first",
      "Try practicing with simple examples before moving on",
      "Consider reviewing prerequisite concepts",
      "Use multiple learning resources for difficult topics",
    ],
  };
}

/**
 * Get recommendations for users who found content easy
 * Focus on providing more advanced and challenging content
 */
async function getPathForEasyContent(currentVideo, userProfile) {
  // For users who find content easy, provide:
  // 1. More advanced videos
  // 2. Challenge resources
  // 3. Practical application opportunities

  // Get more advanced videos in the same category
  const advancedVideos = await Video.find({
    category: currentVideo.category,
    $or: [
      { difficultyLevel: "advanced" },
      {
        difficultyLevel: "intermediate",
        level: { $gt: currentVideo.level || 3 },
      },
    ],
    _id: { $ne: currentVideo._id },
  }).limit(3);

  // Get advanced resources
  const challengeResources = await Resource.find({
    $or: [{ recommendedFor: "difficult" }, { recommendedFor: "justright" }],
    $or: [
      { tags: { $in: currentVideo.tags || [] } },
      { category: currentVideo.category },
    ],
  }).limit(4);

  // Find related advanced topics
  const relatedAdvancedVideos = await Video.find({
    tags: { $in: currentVideo.tags || [] },
    difficultyLevel: "advanced",
  }).limit(2);

  // Craft a custom learning path focusing on advanced topics
  const learningPath = [
    ...advancedVideos.map(formatVideoForResponse),
    ...relatedAdvancedVideos
      .filter(
        (v) =>
          !advancedVideos.some((av) => av._id.toString() === v._id.toString())
      )
      .map(formatVideoForResponse),
  ].slice(0, 3); // Ensure we have at most 3 videos

  return {
    nextVideo:
      advancedVideos.length > 0
        ? formatVideoForResponse(advancedVideos[0])
        : null,
    resources: challengeResources.map(formatResourceForResponse),
    learningPath,
    learningTips: [
      "Challenge yourself with more advanced concepts",
      "Apply your knowledge to real-world projects",
      "Explore related topics to expand your understanding",
      "Consider teaching these concepts to solidify your knowledge",
      "Look for opportunities to integrate multiple concepts",
    ],
  };
}

/**
 * Get recommendations for users who found content just right
 * Focus on providing balanced content that builds on current knowledge
 */
async function getPathForJustRightContent(currentVideo, userProfile) {
  // For users who find content at the right level, provide:
  // 1. Natural next-step videos
  // 2. Complementary resources
  // 3. Well-balanced learning path

  // Get videos that are the next logical steps
  const nextStepVideos = await Video.find({
    $or: [
      {
        sequenceId: currentVideo.sequenceId,
        sequencePosition: { $gt: currentVideo.sequencePosition || 0 },
      },
      {
        category: currentVideo.category,
        level: {
          $gte: currentVideo.level || 3,
          $lte: (currentVideo.level || 3) + 1,
        },
      },
    ],
    _id: { $ne: currentVideo._id },
  })
    .limit(3)
    .sort({ sequencePosition: 1, level: 1 });

  // Get appropriate resources
  const complementaryResources = await Resource.find({
    recommendedFor: "justright",
    $or: [
      { tags: { $in: currentVideo.tags || [] } },
      { category: currentVideo.category },
    ],
  }).limit(4);

  // Find related videos at appropriate difficulty
  const relatedVideos = await Video.find({
    tags: { $in: currentVideo.tags || [] },
    difficultyLevel: currentVideo.difficultyLevel || "intermediate",
  }).limit(2);

  // Craft a balanced learning path
  const learningPath = [
    ...nextStepVideos.map(formatVideoForResponse),
    ...relatedVideos
      .filter(
        (v) =>
          !nextStepVideos.some((nv) => nv._id.toString() === v._id.toString())
      )
      .map(formatVideoForResponse),
  ].slice(0, 3); // Ensure we have at most 3 videos

  return {
    nextVideo:
      nextStepVideos.length > 0
        ? formatVideoForResponse(nextStepVideos[0])
        : null,
    resources: complementaryResources.map(formatResourceForResponse),
    learningPath,
    learningTips: [
      "Continue with the recommended learning path",
      "Practice regularly to reinforce your knowledge",
      "Balance theory with practical applications",
      "Take notes on key concepts to enhance retention",
      "Periodically review what you've learned",
    ],
  };
}

/**
 * Update user's learning history with the current video
 */
async function updateLearningHistory(userProfile, video, difficulty) {
  // Add video to learning history if not already present
  const existingEntry = userProfile.learningHistory.find(
    (entry) => entry.videoId.toString() === video._id.toString()
  );

  if (!existingEntry) {
    userProfile.learningHistory.push({
      videoId: video._id,
      videoTitle: video.title,
      category: video.category,
      tags: video.tags,
      difficulty,
      watchDate: new Date(),
      interactionSummary: {
        duration: 0,
        pauseCount: 0,
        replayCount: 0,
        completionRatio: 1.0,
      },
    });
  } else {
    // Update existing entry
    existingEntry.difficulty = difficulty;
    existingEntry.watchDate = new Date();
  }

  // Update skill levels based on tags
  if (video.tags && video.tags.length > 0) {
    video.tags.forEach((tag) => {
      const currentSkill = userProfile.skillLevels.get(tag) || {
        level: 1,
        confidence: 0.5,
        lastUpdated: new Date(),
      };

      // Adjust skill level based on difficulty feedback
      if (difficulty === "easy") {
        currentSkill.level = Math.min(5, currentSkill.level + 0.5);
        currentSkill.confidence = Math.min(1.0, currentSkill.confidence + 0.1);
      } else if (difficulty === "difficult") {
        currentSkill.confidence = Math.max(0.1, currentSkill.confidence - 0.1);
      } else {
        currentSkill.level = Math.min(5, currentSkill.level + 0.2);
        currentSkill.confidence = Math.min(1.0, currentSkill.confidence + 0.05);
      }

      currentSkill.lastUpdated = new Date();
      userProfile.skillLevels.set(tag, currentSkill);
    });
  }

  await userProfile.save();
}

/**
 * Format a video object for response
 */
function formatVideoForResponse(video) {
  return {
    _id: video._id,
    title: video.title,
    description: video.description || "",
    difficultyLevel: video.difficultyLevel || "intermediate",
    category: video.category || "general",
    type: "video",
    url: `/api/videos/stream/${video._id}`,
    thumbnailPath: video.thumbnailPath || "",
    tags: video.tags || [],
    level: video.level || 3,
  };
}

/**
 * Format a resource object for response
 */
function formatResourceForResponse(resource) {
  let resourceUrl = "";

  if (resource.type === "pdf" && resource.filePath) {
    const filename = resource.filePath.split(/[\/\\]/).pop();
    resourceUrl = `/direct-pdf/${filename}`;
  } else if (resource.type === "link") {
    resourceUrl = resource.url || "";
  }

  return {
    _id: resource._id,
    title: resource.title || "Learning Resource",
    description: resource.description || "Additional learning material",
    type: resource.type || "text",
    url: resourceUrl,
    content: resource.type === "text" ? resource.content : undefined,
    recommendedFor: resource.recommendedFor || "",
    category: resource.category || "",
    tags: resource.tags || [],
  };
}

/**
 * Submit feedback and get personalized recommendations
 * Enhanced to provide more targeted recommendations
 */
exports.submitFeedbackAndGetRecommendations = asyncHandler(async (req, res) => {
  const { videoId, userId, perceivedDifficulty, comments, interactionData } =
    req.body;

  if (!videoId || !userId || !perceivedDifficulty) {
    return res.status(400).json({
      success: false,
      message: "Missing required parameters",
    });
  }

  try {
    // 1. Store the feedback in database
    let userInteraction = await UserInteraction.findOne({ userId, videoId });

    if (userInteraction) {
      userInteraction.userFeedback = perceivedDifficulty;
      userInteraction.comments = comments || "";
      userInteraction.updatedAt = Date.now();
      await userInteraction.save();
    } else {
      userInteraction = await UserInteraction.create({
        userId,
        videoId,
        userFeedback: perceivedDifficulty,
        comments: comments || "",
      });
    }

    // 2. Get personalized recommendations
    const recommendationsRequest = {
      params: { videoId },
      body: { userId, difficulty: perceivedDifficulty },
    };

    // Call the personalized recommendations function directly
    await this.getPersonalizedRecommendations(recommendationsRequest, res);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting feedback",
      error: error.message,
    });
  }
});

module.exports = exports;
