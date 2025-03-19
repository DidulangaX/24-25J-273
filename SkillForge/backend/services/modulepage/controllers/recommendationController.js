// controllers/recommendationController.js
const asyncHandler = require("express-async-handler");
const Video = require("../models/Video");
const Resource = require("../models/Resource");
const UserProfile = require("../models/UserProfile");
const UserInteraction = require("../models/UserInteraction");

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
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    let userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
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

    let nextSteps;
    if (difficulty === "difficult") {
      nextSteps = await getPathForDifficultContent(currentVideo, userProfile);
    } else if (difficulty === "easy") {
      nextSteps = await getPathForEasyContent(currentVideo, userProfile);
    } else {
      nextSteps = await getPathForJustRightContent(currentVideo, userProfile);
    }

    await updateLearningHistory(userProfile, currentVideo, difficulty);

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

async function getPathForDifficultContent(currentVideo, userProfile) {
  const easierVideos = await Video.find({
    category: currentVideo.category,
    difficultyLevel: "beginner",
    _id: { $ne: currentVideo._id },
    level: { $lt: currentVideo.level || 3 },
  }).limit(3);

  const supportResources = await Resource.find({
    recommendedFor: "easy",
    $or: [
      { tags: { $in: currentVideo.tags || [] } },
      { category: currentVideo.category },
    ],
  }).limit(4);

  const foundationalVideos = await Video.find({
    tags: { $in: currentVideo.tags || [] },
    difficultyLevel: "beginner",
  }).limit(2);

  const learningPath = [
    ...easierVideos.map(formatVideoForResponse),
    ...foundationalVideos
      .filter(
        (v) =>
          !easierVideos.some((ev) => ev._id.toString() === v._id.toString())
      )
      .map(formatVideoForResponse),
  ].slice(0, 3);

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

async function getPathForEasyContent(currentVideo, userProfile) {
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

  const challengeResources = await Resource.find({
    $or: [{ recommendedFor: "difficult" }, { recommendedFor: "justright" }],
    $or: [
      { tags: { $in: currentVideo.tags || [] } },
      { category: currentVideo.category },
    ],
  }).limit(4);

  const relatedAdvancedVideos = await Video.find({
    tags: { $in: currentVideo.tags || [] },
    difficultyLevel: "advanced",
  }).limit(2);

  const learningPath = [
    ...advancedVideos.map(formatVideoForResponse),
    ...relatedAdvancedVideos
      .filter(
        (v) =>
          !advancedVideos.some((av) => av._id.toString() === v._id.toString())
      )
      .map(formatVideoForResponse),
  ].slice(0, 3);

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

async function getPathForJustRightContent(currentVideo, userProfile) {
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

  const complementaryResources = await Resource.find({
    recommendedFor: "justright",
    $or: [
      { tags: { $in: currentVideo.tags || [] } },
      { category: currentVideo.category },
    ],
  }).limit(4);

  const relatedVideos = await Video.find({
    tags: { $in: currentVideo.tags || [] },
    difficultyLevel: currentVideo.difficultyLevel || "intermediate",
  }).limit(2);

  const learningPath = [
    ...nextStepVideos.map(formatVideoForResponse),
    ...relatedVideos
      .filter(
        (v) =>
          !nextStepVideos.some((nv) => nv._id.toString() === v._id.toString())
      )
      .map(formatVideoForResponse),
  ].slice(0, 3);

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

async function updateLearningHistory(userProfile, video, difficulty) {
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
    existingEntry.difficulty = difficulty;
    existingEntry.watchDate = new Date();
  }

  if (video.tags && video.tags.length > 0) {
    video.tags.forEach((tag) => {
      const currentSkill = userProfile.skillLevels.get(tag) || {
        level: 1,
        confidence: 0.5,
        lastUpdated: new Date(),
      };

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
