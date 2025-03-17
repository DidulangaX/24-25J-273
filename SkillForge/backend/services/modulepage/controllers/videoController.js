const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const Video = require("../models/Video");
const UserInteraction = require("../models/UserInteraction");
const Resource = require("../models/Resource");
const UserProfile = require("../models/UserProfile");
const { calculateDifficulty } = require("../utils/difficultyDetection");
const { generateSummary } = require("../utils/interactionAnalytics");
const DifficultyDetectionService = require("../services/difficultyDetectionService");

// Initialize the difficulty detection service
const difficultyService = new DifficultyDetectionService();

// Store session interactions in memory - global variable
let sessionInteractions = {};

// Cleanup function to remove old interactions
const cleanupOldInteractions = () => {
  // Keep only interactions from the last 30 minutes
  const cutoffTime = Date.now() - 30 * 60 * 1000;

  for (const videoId in sessionInteractions) {
    for (const userId in sessionInteractions[videoId]) {
      // Filter out old interactions
      sessionInteractions[videoId][userId] = sessionInteractions[videoId][
        userId
      ].filter(
        (interaction) => new Date(interaction.timestamp).getTime() > cutoffTime
      );

      // Remove empty user arrays
      if (sessionInteractions[videoId][userId].length === 0) {
        delete sessionInteractions[videoId][userId];
      }
    }

    // Remove empty video objects
    if (Object.keys(sessionInteractions[videoId]).length === 0) {
      delete sessionInteractions[videoId];
    }
  }

  console.log("Cleaned up old interactions");
};

// Run cleanup every 5 minutes
setInterval(cleanupOldInteractions, 5 * 60 * 1000);

// Get all videos
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find({});
    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res
      .status(500)
      .json({ message: "Error fetching videos", error: error.message });
  }
};

// Get main videos (non-recommendations)
exports.getMainVideos = async (req, res) => {
  try {
    const videos = await Video.find({ isRecommendation: false });
    res.json(videos);
  } catch (error) {
    console.error("Error fetching main videos:", error);
    res
      .status(500)
      .json({ message: "Error fetching main videos", error: error.message });
  }
};

// In videoController.js, enhance getRecommendations
exports.getRecommendations = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { difficulty } = req.query;

    console.log(
      `Getting recommendations for video ${videoId} with difficulty ${difficulty}`
    );

    // Find main video
    const mainVideo = await Video.findById(videoId);
    if (!mainVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Find videos based on difficulty level with a more robust query
    const recommendedVideos = await Video.find({
      isRecommendation: true,
      recommendedFor: difficulty || "easy",
      _id: { $ne: videoId }, // Exclude current video
    }).limit(3);

    // If no specific recommendations, get general ones
    if (recommendedVideos.length === 0) {
      console.log("No specific recommendations found, getting general ones");
      const generalVideos = await Video.find({
        isRecommendation: true,
        _id: { $ne: videoId },
      }).limit(3);

      if (generalVideos.length > 0) {
        recommendedVideos.push(...generalVideos);
      }
    }

    // Get PDF resources
    const recommendedResources = await Resource.find({
      recommendedFor: difficulty || "easy",
    }).limit(2);

    // Format response
    const response = {
      success: true,
      recommendations: {
        videos: recommendedVideos.map((video) => ({
          id: video._id,
          title: video.title,
          description: video.description,
          type: "video",
          url: `/api/videos/stream/${video._id}`,
        })),
        resources: recommendedResources.map((resource) => ({
          id: resource._id,
          title: resource.title,
          description: resource.description,
          type: resource.type,
          url:
            resource.type === "pdf"
              ? `/uploads/${path.basename(resource.filePath)}`
              : resource.url,
        })),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      message: "Error getting recommendations",
      error: error.message,
    });
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (video) {
      res.json(video);
    } else {
      res.status(404).json({ message: "Video not found" });
    }
  } catch (error) {
    console.error("Error fetching video:", error);
    res
      .status(500)
      .json({ message: "Error fetching video", error: error.message });
  }
};

// Update this method in your videoController.js

// Create new video
exports.createVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a video file" });
    }

    // Extract basic fields
    const {
      title,
      description,
      category,
      difficultyLevel,
      isRecommendation,
      recommendedFor,
    } = req.body;

    // Extract new learning path fields
    const { sequenceId, sequencePosition, level, tags, prerequisites } =
      req.body;

    // Prepare video data object
    const videoData = {
      title,
      description,
      category: category || "general",
      difficultyLevel: difficultyLevel || "intermediate",
      filePath: req.file.path,
      thumbnailPath: req.body.thumbnailPath || "",
      isRecommendation: isRecommendation === "true",
      recommendedFor: recommendedFor || "",
    };

    // Add learning path fields if provided
    if (sequenceId) videoData.sequenceId = sequenceId;
    if (sequencePosition)
      videoData.sequencePosition = parseInt(sequencePosition, 10);
    if (level) videoData.level = parseInt(level, 10);

    // Process tags if provided
    if (tags) {
      if (typeof tags === "string") {
        videoData.tags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      } else if (Array.isArray(tags)) {
        videoData.tags = tags;
      }
    }

    // Process prerequisites if provided
    if (prerequisites) {
      try {
        if (typeof prerequisites === "string") {
          videoData.prerequisites = JSON.parse(prerequisites);
        } else if (Array.isArray(prerequisites)) {
          videoData.prerequisites = prerequisites;
        }
      } catch (parseError) {
        console.error("Error parsing prerequisites:", parseError);
      }
    }

    // Create video entry in database
    const video = await Video.create(videoData);

    console.log(`Created video: ${video.title} with ID ${video._id}`);
    console.log("Learning path data:", {
      sequenceId: video.sequenceId,
      sequencePosition: video.sequencePosition,
      level: video.level,
      tags: video.tags,
      prerequisites: video.prerequisites,
    });

    res.status(201).json(video);
  } catch (error) {
    console.error("Error creating video:", error);
    res
      .status(500)
      .json({ message: "Error creating video", error: error.message });
  }
};

// In videoController.js
exports.trackInteraction = (req, res) => {
  const { videoId, userId, interactionType, position, timestamp, ...metadata } =
    req.body;

  // Validate required fields
  if (!videoId || !userId || !interactionType) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: videoId, userId, or interactionType",
    });
  }

  console.log(
    `Tracking interaction: ${interactionType} for user ${userId} on video ${videoId} at position ${
      position || "unknown"
    }`
  );

  // Initialize session storage if needed
  if (!sessionInteractions[videoId]) {
    sessionInteractions[videoId] = {};
  }
  if (!sessionInteractions[videoId][userId]) {
    sessionInteractions[videoId][userId] = [];
  }

  // Store the interaction
  const newInteraction = {
    interactionType,
    position: position !== undefined ? position : null,
    timestamp: timestamp || new Date().toISOString(),
    ...metadata,
  };

  // Add to interactions array
  sessionInteractions[videoId][userId].push(newInteraction);

  console.log(
    `Interaction count: ${sessionInteractions[videoId][userId].length}`
  );

  res.status(200).json({
    message: "Interaction tracked successfully",
    success: true,
    interactionCount: sessionInteractions[videoId][userId].length,
  });
};

// Stream video
exports.streamVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`Attempting to stream video with ID: ${videoId}`);

    const video = await Video.findById(videoId);
    if (!video) {
      console.log(`Video not found for ID: ${videoId}`);
      return res.status(404).send("Video not found");
    }

    console.log(`Video object:`, video);

    const videoPath = video.filePath;
    console.log(`Full video path: ${videoPath}`);

    if (!fs.existsSync(videoPath)) {
      console.error(`File not found: ${videoPath}`);
      return res.status(404).send("Video file not found");
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error("Error streaming video:", error);
    res.status(500).send("Error streaming video");
  }
};

// Get difficulty for a video
exports.getDifficulty = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const interactions = await UserInteraction.find({ videoId });
    const difficulty = calculateDifficulty(interactions, video.duration || 300);

    res.json({ videoId, difficulty });
  } catch (error) {
    console.error("Error getting difficulty:", error);
    res
      .status(500)
      .json({ message: "Error getting difficulty", error: error.message });
  }
};

exports.detectDifficulty = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body;

    if (!videoId || !userId) {
      return res.status(400).json({
        message: "Missing required parameters",
        success: false,
      });
    }

    // Check if we have interactions
    if (
      !sessionInteractions[videoId] ||
      !sessionInteractions[videoId][userId] ||
      sessionInteractions[videoId][userId].length < 2
    ) {
      return res.status(404).json({
        message: "Not enough interaction data. Please watch more of the video.",
        success: false,
      });
    }

    // Get video information
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        message: "Video not found",
        success: false,
      });
    }

    // Get and process interactions
    const interactions = sessionInteractions[videoId][userId];
    const interactionData = processInteractions(
      interactions,
      video.duration || 300
    );
    console.log(
      "Processed interaction data for difficulty detection:",
      interactionData
    );

    // Call Python script with interaction data as JSON
    const pythonScriptPath = path.join(
      __dirname,
      "../utils/simple_predictor.py"
    );
    console.log(`Running Python script: ${pythonScriptPath}`);

    const pythonProcess = spawn("python", [
      pythonScriptPath,
      JSON.stringify(interactionData),
    ]);

    let predictionData = "";
    let errorOutput = "";

    // Collect output from the Python script
    pythonProcess.stdout.on("data", (data) => {
      predictionData += data.toString();
      console.log(`Python stdout: ${data.toString()}`);
    });

    // Collect any error messages
    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error(`Python stderr: ${data.toString()}`);
    });

    // Handle process completion
    pythonProcess.on("close", async (code) => {
      console.log(`Python process exited with code ${code}`);

      try {
        // Parse prediction result
        const prediction = predictionData
          ? JSON.parse(predictionData)
          : {
              predicted_difficulty: 0,
              confidence: 0.5,
              insights: [
                "Unable to determine difficulty - using default values",
              ],
            };

        // Generate contextual recommendations
        const recommendations = [];

        // Check for problematic sections
        if (
          interactionData.problematic_sections &&
          interactionData.problematic_sections.length > 0
        ) {
          const difficultSections = interactionData.problematic_sections;

          // Add section-specific recommendations
          difficultSections.forEach((section) => {
            const timeRange = `${formatTime(section.startTime)}-${formatTime(
              section.endTime
            )}`;

            if (section.replayCount > 0) {
              recommendations.push(
                `You replayed section ${timeRange} ${section.replayCount} times. Consider reviewing this concept more thoroughly.`
              );
            } else if (section.pauseCount > 1) {
              recommendations.push(
                `We noticed you paused frequently during ${timeRange}. This section might contain challenging concepts.`
              );
            }
          });
        }

        // Add general recommendations based on interaction patterns
        if (prediction.predicted_difficulty === 1) {
          if (interactionData.replay_frequency > 2) {
            recommendations.push(
              "Try taking notes during your viewing to reinforce key concepts."
            );
          }

          if (interactionData.pause_rate > 8) {
            recommendations.push(
              "Consider reviewing prerequisite content before continuing."
            );
          }
        } else {
          if (interactionData.seek_forward_frequency > 3) {
            recommendations.push(
              "You're advancing quickly - consider exploring more challenging content"
            );
          }
        }

        // Combine everything into a final response
        return res.json({
          videoId,
          userId,
          prediction,
          interactionSummary: interactionData,
          recommendations:
            recommendations.length > 0
              ? recommendations
              : [
                  prediction.predicted_difficulty === 1
                    ? "Consider reviewing prerequisite content before continuing"
                    : "Continue with the recommended learning path",
                ],
          success: true,
        });
      } catch (error) {
        console.error("Error processing prediction:", error);
        return res.status(500).json({
          message: "Error processing difficulty prediction",
          error: error.message,
          pythonOutput: predictionData,
          pythonError: errorOutput,
          success: false,
        });
      }
    });
  } catch (error) {
    console.error("Error in detectDifficulty:", error);
    res.status(500).json({
      message: "Error detecting difficulty",
      error: error.message,
      success: false,
    });
  }
};

// Helper function to format time (seconds to MM:SS)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Helper function to format time (seconds to MM:SS)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Helper functions
function calculateEngagementScore(interactionData) {
  const {
    session_duration = 0,
    total_pauses = 0,
    replay_frequency = 0,
    replay_duration = 0,
    seek_forward_frequency = 0,
    skipped_content = 0,
  } = interactionData;

  // Base score from session duration (max 40 points for 5+ minutes)
  const durationScore = Math.min(session_duration / 7.5, 40);

  // Replay score (active engagement through review)
  const replayScore = Math.min(replay_frequency * 5, 20);

  // Penalty for excessive skipping (disengagement)
  const skipPenalty = Math.min(skipped_content / 15, 20);

  // Pause score (some pauses show engagement, too many suggest difficulty)
  const pauseScore = total_pauses > 0 ? Math.min(10, total_pauses * 2) : 0;
  const pausePenalty = Math.max(0, (total_pauses - 5) * 2);

  // Calculate final score (capped between 0-100)
  return Math.max(
    0,
    Math.min(
      durationScore + replayScore + pauseScore - skipPenalty - pausePenalty,
      100
    )
  );
}

function getEngagementLevel(score) {
  if (score >= 80) return "High Engagement";
  if (score >= 60) return "Good Engagement";
  if (score >= 40) return "Moderate Engagement";
  if (score >= 20) return "Low Engagement";
  return "Very Low Engagement";
}

function generateRecommendations(isDifficult, interactionData) {
  const recommendations = [];

  if (isDifficult) {
    // Recommendations for content perceived as difficult
    recommendations.push(
      "Consider reviewing prerequisite content before continuing"
    );

    if (interactionData.total_pauses > 5) {
      recommendations.push(
        "Try taking notes during pauses to reinforce your understanding"
      );
    }

    if (interactionData.replay_frequency > 0) {
      recommendations.push(
        "Focus on the sections you replayed, they contain key concepts"
      );
    } else {
      recommendations.push(
        "Use the replay feature to review challenging sections"
      );
    }

    if (interactionData.average_speed < 1.0) {
      recommendations.push(
        "You've slowed down the video - consider additional practice exercises"
      );
    }
  } else {
    // Recommendations for content not perceived as difficult
    if (interactionData.session_duration > 120) {
      recommendations.push(
        "You seem to have a good grasp of this topic. Consider exploring related advanced content"
      );
    }

    if (interactionData.average_speed > 1.0) {
      recommendations.push(
        "Since you watched at a faster speed, you might be ready for more challenging content"
      );
    }

    if (
      interactionData.total_pauses < 2 &&
      interactionData.session_duration > 60
    ) {
      recommendations.push(
        "Try the practice exercises to reinforce your understanding"
      );
    }

    if (interactionData.seek_forward_frequency > 3) {
      recommendations.push(
        "You navigated quickly through parts of the content - consider a comprehensive review if needed"
      );
    }
  }

  // If we don't have many recommendations, add a general one
  if (recommendations.length < 1) {
    recommendations.push(
      isDifficult
        ? "Consider reaching out to peers or instructors for additional support"
        : "Continue with the recommended learning path"
    );
  }

  // Limit to 3 most relevant recommendations
  return recommendations.slice(0, 3);
}

// Add these helper functions
function calculateEngagementScore(interactionData) {
  const {
    session_duration = 0,
    total_pauses = 0,
    replay_frequency = 0,
    replay_duration = 0,
    seek_forward_frequency = 0,
    skipped_content = 0,
  } = interactionData;

  // Base score from session duration (max 40 points for 5+ minutes)
  const durationScore = Math.min(session_duration / 7.5, 40);

  // Replay score (active engagement through review)
  const replayScore = Math.min(replay_frequency * 5, 20);

  // Penalty for excessive skipping (disengagement)
  const skipPenalty = Math.min(skipped_content / 15, 20);

  // Pause score (some pauses show engagement, too many suggest difficulty)
  const pauseScore = total_pauses > 0 ? Math.min(10, total_pauses * 2) : 0;
  const pausePenalty = Math.max(0, (total_pauses - 5) * 2);

  // Calculate final score (capped between 0-100)
  return Math.max(
    0,
    Math.min(
      durationScore + replayScore + pauseScore - skipPenalty - pausePenalty,
      100
    )
  );
}

function getEngagementLevel(score) {
  if (score >= 80) return "High Engagement";
  if (score >= 60) return "Good Engagement";
  if (score >= 40) return "Moderate Engagement";
  if (score >= 20) return "Low Engagement";
  return "Very Low Engagement";
}

//  update submitDifficultyFeedback in videoController.js

exports.submitDifficultyFeedback = async (req, res) => {
  try {
    const { videoId, userId, perceivedDifficulty, comments } = req.body;

    console.log(
      `User ${userId} feedback for video ${videoId}: ${perceivedDifficulty}`
    );

    // Input validation
    if (!videoId || !userId || !perceivedDifficulty) {
      return res.status(400).json({
        message:
          "Missing required fields: videoId, userId, or perceivedDifficulty",
        success: false,
      });
    }

    // Validate difficulty level
    if (!["easy", "justright", "difficult"].includes(perceivedDifficulty)) {
      return res.status(400).json({
        message:
          "Invalid difficulty level. Must be 'easy', 'justright', or 'difficult'",
        success: false,
      });
    }

    // Find the video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        message: "Video not found",
        success: false,
      });
    }

    // Store the feedback in MongoDB
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

    // Prepare recommendation response based on difficulty
    const recommendationResponse = {
      resources: [],
      nextVideo: null,
      learningPath: [],
      difficulty: perceivedDifficulty,
    };

    // Get resources based on difficulty
    let resourceQuery = {
      recommendedFor: perceivedDifficulty,
    };

    // If no specific resources for this difficulty, get general ones
    const specificResources = await Resource.find(resourceQuery).limit(3);
    if (specificResources.length > 0) {
      recommendationResponse.resources = specificResources.map((resource) => ({
        _id: resource._id,
        title: resource.title || "Learning Resource",
        description: resource.description || "Additional learning material",
        type: resource.type || "text",
        url: formatResourceUrl(resource),
        content: resource.type === "text" ? resource.content : undefined,
        recommendedFor: resource.recommendedFor || "",
        category: resource.category || "",
      }));
    } else {
      // Fallback to any resources if none specific to this difficulty
      const anyResources = await Resource.find({}).limit(3);
      recommendationResponse.resources = anyResources.map((resource) => ({
        _id: resource._id,
        title: resource.title || "Learning Resource",
        description: resource.description || "Additional learning material",
        type: resource.type || "text",
        url: formatResourceUrl(resource),
        content: resource.type === "text" ? resource.content : undefined,
        recommendedFor: resource.recommendedFor || "",
        category: resource.category || "",
      }));
    }

    // Generate next video recommendation - need simple logic to find another video
    // based on difficulty level
    let videoQuery = { _id: { $ne: videoId } }; // Don't recommend the same video

    // Adjust the query based on difficulty feedback
    if (perceivedDifficulty === "difficult") {
      // If user found it difficult, recommend easier content
      videoQuery.difficultyLevel = "beginner";
    } else if (perceivedDifficulty === "easy") {
      // If user found it easy, recommend more advanced content
      videoQuery.difficultyLevel = "advanced";
    } else {
      // For "just right", find similar difficulty
      videoQuery.difficultyLevel = video.difficultyLevel || "intermediate";
    }

    // Try to find a video matching criteria
    const nextVideo = await Video.findOne(videoQuery);
    if (nextVideo) {
      recommendationResponse.nextVideo = {
        _id: nextVideo._id,
        title: nextVideo.title,
        description: nextVideo.description || "",
        difficultyLevel: nextVideo.difficultyLevel || "intermediate",
        category: nextVideo.category || "general",
        type: "video",
        url: `/api/videos/stream/${nextVideo._id}`,
        thumbnailPath: nextVideo.thumbnailPath || "",
      };
    }

    // Generate learning path (3 videos in progression)
    // Different strategies based on difficulty
    let pathQuery = { _id: { $ne: videoId } };

    if (perceivedDifficulty === "difficult") {
      // For difficult feedback, create a path of increasingly difficult videos
      // starting from easier content
      const easyVideos = await Video.find({
        difficultyLevel: "beginner",
        _id: { $ne: videoId },
      }).limit(1);

      const intermediateVideos = await Video.find({
        difficultyLevel: "intermediate",
        _id: { $ne: videoId },
      }).limit(1);

      const advancedVideos = await Video.find({
        difficultyLevel: "advanced",
        _id: { $ne: videoId },
      }).limit(1);

      recommendationResponse.learningPath = [
        ...easyVideos,
        ...intermediateVideos,
        ...advancedVideos,
      ].map((video) => ({
        _id: video._id,
        title: video.title,
        description: video.description || "",
        difficultyLevel: video.difficultyLevel || "intermediate",
        category: video.category || "general",
        type: "video",
        url: `/api/videos/stream/${video._id}`,
        thumbnailPath: video.thumbnailPath || "",
      }));
    } else if (perceivedDifficulty === "easy") {
      // For easy feedback, provide more challenging content
      const advancedVideos = await Video.find({
        difficultyLevel: "advanced",
        _id: { $ne: videoId },
      }).limit(3);

      recommendationResponse.learningPath = advancedVideos.map((video) => ({
        _id: video._id,
        title: video.title,
        description: video.description || "",
        difficultyLevel: video.difficultyLevel || "advanced",
        category: video.category || "general",
        type: "video",
        url: `/api/videos/stream/${video._id}`,
        thumbnailPath: video.thumbnailPath || "",
      }));
    } else {
      // For "just right", provide a balanced mix
      const allVideos = await Video.find({
        _id: { $ne: videoId },
      }).limit(3);

      recommendationResponse.learningPath = allVideos.map((video) => ({
        _id: video._id,
        title: video.title,
        description: video.description || "",
        difficultyLevel: video.difficultyLevel || "intermediate",
        category: video.category || "general",
        type: "video",
        url: `/api/videos/stream/${video._id}`,
        thumbnailPath: video.thumbnailPath || "",
      }));
    }

    console.log(
      `Generated recommendations for ${perceivedDifficulty} difficulty:`,
      {
        resourcesCount: recommendationResponse.resources.length,
        hasNextVideo: !!recommendationResponse.nextVideo,
        learningPathCount: recommendationResponse.learningPath.length,
      }
    );

    return res.json({
      message: "Feedback received and processed",
      recommendations: recommendationResponse,
      success: true,
    });
  } catch (error) {
    console.error("Error in submitDifficultyFeedback:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
      // Return empty but valid recommendations structure
      recommendations: {
        resources: [],
        nextVideo: null,
        learningPath: [],
        difficulty: "justright",
      },
    });
  }
};

// Helper function to format resource URL
function formatResourceUrl(resource) {
  if (!resource) return "";

  if (resource.type === "pdf" && resource.filePath) {
    // Extract filename for PDFs
    const filename =
      typeof resource.filePath === "string"
        ? resource.filePath.split(/[\/\\]/).pop()
        : null;

    return filename ? `/direct-pdf/${filename}` : "";
  } else if (resource.type === "link") {
    return resource.url || "";
  }

  return "";
}

// Replace the getRecommendationsForVideo function in the backend's videoController.js
async function getRecommendationsForVideo(videoId, difficulty) {
  try {
    console.log(
      `Finding recommendations for difficulty level: "${difficulty}"`
    );

    // Always return a consistent structure
    const result = {
      video: null,
      resources: [],
    };

    // Find the current video
    const mainVideo = await Video.findById(videoId);
    if (!mainVideo) {
      console.log("Video not found");
      return result;
    }

    // First, try to get resources
    try {
      let resourceQuery = {};

      // Add difficulty level to the query - use a more flexible approach
      if (difficulty) {
        if (difficulty === "difficult") {
          // For difficult content, look for supplementary or easier resources
          resourceQuery.$or = [
            { recommendedFor: "difficult" },
            { recommendedFor: "easy" },
          ];
        } else if (difficulty === "easy") {
          // For easy content, look for more challenging resources
          resourceQuery.$or = [
            { recommendedFor: "easy" },
            { recommendedFor: "justright" },
            { recommendedFor: "advanced" },
          ];
        } else {
          // For "just right" content
          resourceQuery.$or = [{ recommendedFor: "justright" }];
        }
      }

      // Add category filter if available
      if (mainVideo.category && mainVideo.category !== "general") {
        // Add to existing $or query or create a new one
        if (resourceQuery.$or) {
          // Add category as an additional filter, not as an additional $or condition
          resourceQuery.category = mainVideo.category;
        } else {
          resourceQuery.$or = [
            { category: mainVideo.category },
            { tags: mainVideo.category },
          ];
        }
      }

      console.log("Resource query:", JSON.stringify(resourceQuery));

      // First try specific query for this difficulty
      let resources = await Resource.find(resourceQuery).limit(3);
      console.log(
        `Found ${resources.length} resources matching difficulty criteria`
      );

      // If no specific resources found, try a more general search
      if (!resources || resources.length === 0) {
        console.log("No specific resources found, getting general resources");
        const generalResources = await Resource.find({}).limit(3);

        if (generalResources && generalResources.length > 0) {
          resources = generalResources;
          console.log(`Found ${generalResources.length} general resources`);
        }
      }

      // Format the resources
      if (resources && resources.length > 0) {
        result.resources = resources.map(formatResource);
      }
    } catch (resourceError) {
      console.error("Error finding resources:", resourceError);
      // Continue execution to try finding a recommended video
    }

    // Now, try to find a related video
    try {
      // Build video query
      let videoQuery = {
        _id: { $ne: videoId }, // Exclude current video
      };

      // Add category filter if available
      if (mainVideo.category) {
        videoQuery.category = mainVideo.category;
      }

      // Adjust difficulty level based on feedback
      if (difficulty === "difficult") {
        videoQuery.difficultyLevel = "beginner"; // Recommend easier videos
      } else if (difficulty === "easy") {
        videoQuery.difficultyLevel = "advanced"; // Recommend harder videos
      }

      console.log("Video query:", JSON.stringify(videoQuery));

      // Find a suitable video
      const recommendedVideo = await Video.findOne(videoQuery);

      if (recommendedVideo) {
        console.log(`Found recommended video: ${recommendedVideo.title}`);
        result.video = {
          _id: recommendedVideo._id,
          title: recommendedVideo.title,
          description: recommendedVideo.description || "",
          category: recommendedVideo.category || "general",
          difficultyLevel: recommendedVideo.difficultyLevel || "intermediate",
          type: "video",
          url: `/api/videos/stream/${recommendedVideo._id}`,
        };
      } else {
        // If no specific video found, try any related video
        const anyVideo = await Video.findOne({
          _id: { $ne: videoId },
        }).limit(1);

        if (anyVideo) {
          console.log(`Found general video recommendation: ${anyVideo.title}`);
          result.video = {
            _id: anyVideo._id,
            title: anyVideo.title,
            description: anyVideo.description || "",
            category: anyVideo.category || "general",
            difficultyLevel: anyVideo.difficultyLevel || "intermediate",
            type: "video",
            url: `/api/videos/stream/${anyVideo._id}`,
          };
        }
      }
    } catch (videoError) {
      console.error("Error finding video recommendations:", videoError);
    }

    // Log final result
    console.log(
      `Returning ${result.resources.length} resources and ${
        result.video ? "1" : "0"
      } videos`
    );
    return result;
  } catch (error) {
    console.error("Error in getRecommendationsForVideo:", error);
    // Return empty structure on error
    return {
      video: null,
      resources: [],
    };
  }
}

// Add this formatResource function if it's not already defined
function formatResource(resource) {
  if (!resource) return null;

  // Default resource structure
  const formattedResource = {
    _id: resource._id ? resource._id.toString() : `resource-${Date.now()}`,
    title: resource.title || "Learning Resource",
    description: resource.description || "Additional learning material",
    type: resource.type || "text",
    url: "",
  };

  try {
    // Process URL based on resource type
    if (resource.type === "pdf" && resource.filePath) {
      // Extract filename from path
      const filename =
        typeof resource.filePath === "string"
          ? resource.filePath.split(/[\/\\]/).pop()
          : null;

      if (filename) {
        formattedResource.url = `/direct-pdf/${filename}`;
        formattedResource.filePath = resource.filePath;
      }
    } else if (resource.type === "link") {
      formattedResource.url = resource.url || "";
    } else if (resource.type === "text") {
      formattedResource.content = resource.content || "";
    }
  } catch (error) {
    console.error("Error formatting resource URL:", error);
  }

  return formattedResource;
}
// Helper function to format resources consistently
function formatResource(resource) {
  if (!resource) return null;

  // Default resource structure
  const formattedResource = {
    _id: resource._id ? resource._id.toString() : `resource-${Date.now()}`,
    title: resource.title || "Learning Resource",
    description: resource.description || "Additional learning material",
    type: resource.type || "text",
    url: "",
  };

  try {
    // Process URL based on resource type
    if (resource.type === "pdf" && resource.filePath) {
      // Extract filename from path
      const filename =
        typeof resource.filePath === "string"
          ? resource.filePath.split(/[\/\\]/).pop()
          : null;

      if (filename) {
        formattedResource.url = `/direct-pdf/${filename}`;
        formattedResource.filePath = resource.filePath;
      }
    } else if (resource.type === "link") {
      formattedResource.url = resource.url || "";
    } else if (resource.type === "text") {
      formattedResource.content = resource.content || "";
    }
  } catch (error) {
    console.error("Error formatting resource URL:", error);
  }

  return formattedResource;
}

// Replace the submitDifficultyFeedback function in the backend's videoController.js
exports.submitDifficultyFeedback = async (req, res) => {
  try {
    const { videoId, userId, perceivedDifficulty, comments } = req.body;
    console.log(
      `User ${userId} feedback for video ${videoId}: ${perceivedDifficulty}`
    );

    // Input validation
    if (!videoId || !userId || !perceivedDifficulty) {
      return res.status(400).json({
        message:
          "Missing required fields: videoId, userId, or perceivedDifficulty",
        success: false,
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        message: "Video not found",
        success: false,
      });
    }

    // Store the feedback in MongoDB
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

    // Update the model with interaction data if available
    if (sessionInteractions[videoId] && sessionInteractions[videoId][userId]) {
      const interactions = sessionInteractions[videoId][userId];
      const interactionData = processInteractions(
        interactions,
        video.duration || 300
      );

      // Log the interaction data for debugging
      console.log("Interaction data for model update:", interactionData);

      // Update the model
      try {
        const userFeedbackNumeric = perceivedDifficulty === "difficult" ? 1 : 0;
        const updateResult = await difficultyService.updateModel(
          interactionData,
          userFeedbackNumeric
        );
        console.log("Model update result:", updateResult);
      } catch (updateError) {
        console.error("Error updating model:", updateError);
      }
    }

    // Get recommendations based on difficulty feedback
    console.log(
      `Getting resources for difficulty level: ${perceivedDifficulty}`
    );
    try {
      const recommendations = await getRecommendationsForVideo(
        videoId,
        perceivedDifficulty
      );

      console.log("Recommendations structure:", {
        hasResources: !!recommendations.resources,
        resourceCount: recommendations.resources?.length || 0,
        hasVideo: !!recommendations.video,
      });

      // Ensure resources is always an array
      if (!recommendations.resources) {
        recommendations.resources = [];
      }

      // Return success response with recommendations
      return res.json({
        message: "Feedback received and processed",
        recommendations,
        success: true,
      });
    } catch (recError) {
      console.error("Error getting recommendations:", recError);

      // Return a minimal valid response even if recommendations fail
      return res.json({
        message: "Feedback received and processed",
        recommendations: {
          resources: [],
          video: null,
        },
        success: true,
      });
    }
  } catch (error) {
    console.error("Error in submitDifficultyFeedback:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
      // Even on error, return an empty but valid recommendations structure
      recommendations: {
        resources: [],
        video: null,
      },
    });
  }
};

// Helper function to format resource objects consistently
function formatResource(resource) {
  if (!resource) return null;

  let resourceUrl = "";

  if (resource.type === "pdf") {
    // For PDFs, use the direct-pdf endpoint
    const filename = resource.filePath
      ? path.basename(resource.filePath)
      : null;
    if (filename) {
      resourceUrl = `/direct-pdf/${filename}`;
    }
  } else if (resource.type === "link") {
    resourceUrl = resource.url || "";
  }

  return {
    _id: resource._id.toString(),
    title: resource.title || "Learning Resource",
    description: resource.description || "Additional learning material",
    type: resource.type || "text",
    url: resourceUrl,
    filePath: resource.filePath,
    content: resource.type === "text" ? resource.content : undefined,
  };
}

// In videoController.js - enhance getModelRecommendations
exports.getModelRecommendations = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.query;

    console.log(
      `Getting model-based recommendations for video ${videoId}, user ${userId}`
    );

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Default difficulty level
    let predictedDifficulty = "easy";
    let confidenceScore = 0.5;
    let insightMessage = "Based on limited viewing data";

    // If we have interaction data, get personalized recommendations
    if (sessionInteractions[videoId] && sessionInteractions[videoId][userId]) {
      const interactions = sessionInteractions[videoId][userId];

      if (interactions.length >= 3) {
        // We have enough data to make a prediction
        const interactionData = processInteractions(
          interactions,
          video.duration || 300
        );
        console.log("Processed interaction data:", interactionData);

        try {
          // Get prediction from ML model
          const result = await difficultyService.detectDifficulty(
            interactionData
          );

          if (result.success && result.prediction) {
            predictedDifficulty =
              result.prediction.predicted_difficulty === 1
                ? "difficult"
                : "easy";
            confidenceScore = result.prediction.confidence;
            insightMessage =
              result.prediction.insights[0] || "Based on your viewing patterns";

            console.log(
              `ML model predicted difficulty: ${predictedDifficulty} with ${confidenceScore} confidence`
            );
          }
        } catch (modelError) {
          console.error("Error getting model prediction:", modelError);
          // Continue with default recommendations if model fails
        }
      } else {
        console.log(
          "Not enough interactions for reliable prediction, using defaults"
        );
      }
    }

    // Get appropriate recommendations based on difficulty
    const recommendations = await getRecommendationsForVideo(
      videoId,
      predictedDifficulty
    );

    // Return recommendations with insight information
    res.json({
      ...recommendations,
      modelInsights: {
        predictedDifficulty,
        confidence: Math.round(confidenceScore * 100),
        insightMessage,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error in getModelRecommendations:", error);
    res.status(500).json({
      message: "Error getting recommendations",
      error: error.message,
      success: false,
    });
  }
};

// In videoController.js - replace endSession
exports.endSession = async (req, res) => {
  try {
    const { videoId, userId } = req.body;

    if (!videoId || !userId) {
      return res.status(400).json({
        message: "Missing videoId or userId",
        success: false,
      });
    }

    console.log(`Ending session for user ${userId} on video ${videoId}`);

    // Check if session data exists
    if (
      !sessionInteractions[videoId] ||
      !sessionInteractions[videoId][userId]
    ) {
      return res.status(200).json({
        message: "No session data found",
        success: true,
      });
    }

    // Get the interactions
    const interactions = sessionInteractions[videoId][userId];

    // If no interactions, just return
    if (interactions.length === 0) {
      return res.status(200).json({
        message: "No interactions recorded",
        success: true,
      });
    }

    // Process the interactions
    const summary = processInteractions(interactions, 300); // Default duration

    // Don't clear session data yet - let it accumulate

    // Return summary
    res.status(200).json({
      message: "Session ended successfully",
      summary,
      interactionCount: interactions.length,
      success: true,
    });
  } catch (error) {
    console.error("Error in endSession:", error);
    res.status(500).json({
      message: "Error ending session",
      error: error.message,
      success: false,
    });
  }
};

// In videoController.js - add this new function
exports.clearSession = async (req, res) => {
  try {
    const { videoId, userId } = req.body;

    if (!videoId || !userId) {
      return res.status(400).json({
        message: "Missing videoId or userId",
        success: false,
      });
    }

    console.log(`Clearing session for user ${userId} on video ${videoId}`);

    // Remove the previous session data for this user and video
    if (sessionInteractions[videoId] && sessionInteractions[videoId][userId]) {
      delete sessionInteractions[videoId][userId];
      console.log("Session data cleared successfully");
    }

    res.status(200).json({
      message: "Session cleared successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in clearSession:", error);
    res.status(500).json({
      message: "Error clearing session",
      error: error.message,
      success: false,
    });
  }
};

// Generate learning insights report for a session
exports.generateInsights = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId, sessionData } = req.body;

    // We can either use provided session data or stored interactions
    let interactionData;

    if (sessionData) {
      // Use provided session data
      interactionData = sessionData;
    } else if (
      sessionInteractions[videoId] &&
      sessionInteractions[videoId][userId]
    ) {
      // Use stored interactions
      const interactions = sessionInteractions[videoId][userId];

      if (interactions.length < 3) {
        return res.status(400).json({
          message: "Not enough interaction data to generate insights",
          success: false,
        });
      }

      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      interactionData = processInteractions(
        interactions,
        video.duration || 300
      );
    } else {
      return res.status(404).json({
        message: "No session data found",
        success: false,
      });
    }

    // Get difficulty prediction
    try {
      const predictionResult = await difficultyService.detectDifficulty(
        interactionData
      );

      if (!predictionResult.success) {
        return res.status(500).json({
          message: "Error generating insights",
          error: predictionResult.error,
          success: false,
        });
      }

      // Get user's reported difficulty if available
      const userInteraction = await UserInteraction.findOne({
        userId,
        videoId,
      });
      const reportedDifficulty =
        userInteraction && userInteraction.userFeedback
          ? userInteraction.userFeedback === "difficult"
            ? 1
            : 0
          : null;

      // Generate insights
      const insights = difficultyService.generateInsights(
        predictionResult.prediction,
        interactionData,
        reportedDifficulty
      );

      res.json({
        videoId,
        userId,
        insights,
        success: true,
      });
    } catch (modelError) {
      console.error("Error generating insights:", modelError);
      res.status(500).json({
        message: "Error generating insights",
        error: modelError.message,
        success: false,
      });
    }
  } catch (error) {
    console.error("Error in generateInsights:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

function processInteractions(interactions, videoDuration) {
  // If no interactions, return empty data
  if (!interactions || interactions.length === 0) {
    return {
      session_duration: 0,
      total_pauses: 0,
      pause_median_duration: 0,
      replay_frequency: 0,
      replay_duration: 0,
      seek_forward_frequency: 0,
      skipped_content: 0,
      speed_changes: 0,
      average_speed: 1.0,
      pause_rate: 0,
      replay_ratio: 0,
    };
  }

  console.log(`Processing ${interactions.length} interactions`);

  // Sort interactions by timestamp
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Initialize counters and arrays
  let stats = {
    session_duration: 0,
    total_pauses: 0,
    pause_durations: [],
    replay_frequency: 0,
    replay_duration: 0,
    seek_forward_frequency: 0,
    skipped_content: 0,
    speed_changes: 0,
    average_speed: 1.0,
  };

  let lastPosition = null;
  let lastTimestamp = new Date(sortedInteractions[0].timestamp);
  let pauseStartTime = null;

  // Section analysis (divide video into 10-second sections)
  const sectionSize = 10; // Seconds per section
  const numSections = Math.ceil(videoDuration / sectionSize);
  const sectionPauses = new Array(numSections).fill(0);
  const sectionReplays = new Array(numSections).fill(0);

  // Process each interaction in chronological order
  for (let i = 0; i < sortedInteractions.length; i++) {
    const interaction = sortedInteractions[i];
    const currentPosition =
      interaction.position !== undefined ? interaction.position : null;
    const currentTimestamp = new Date(interaction.timestamp);

    // Calculate time since last interaction (for session duration)
    if (i > 0) {
      const timeDiff = (currentTimestamp - lastTimestamp) / 1000;
      stats.session_duration += timeDiff;
    }

    // Process by interaction type and update section data
    if (currentPosition !== null) {
      const sectionIndex = Math.min(
        Math.floor(currentPosition / sectionSize),
        numSections - 1
      );

      switch (interaction.interactionType) {
        case "pause":
          sectionPauses[sectionIndex]++;
          stats.total_pauses++;
          pauseStartTime = currentTimestamp;
          break;

        case "play":
          // If coming from a pause, record the pause duration
          if (pauseStartTime) {
            const pauseDuration = (currentTimestamp - pauseStartTime) / 1000;
            if (pauseDuration >= 0.5) {
              // Only count pauses longer than 0.5 seconds
              stats.pause_durations.push(pauseDuration);
              console.log(
                `Recorded pause duration: ${pauseDuration.toFixed(2)}s`
              );
            }
            pauseStartTime = null;
          }
          break;
      }
    }

    // Process seeks and implicit seeks
    if (lastPosition !== null && currentPosition !== null) {
      // Calculate difference between current and last position
      const diff = currentPosition - lastPosition;

      // Process significant position changes
      if (Math.abs(diff) > 0.5) {
        if (diff > 0) {
          // Forward seek (skipping content)
          stats.seek_forward_frequency++;
          stats.skipped_content += diff;
          console.log(
            `${
              interaction.interactionType === "seek"
                ? "Forward seek"
                : "Implicit forward seek"
            }: ${diff.toFixed(2)}s from ${lastPosition.toFixed(
              2
            )} to ${currentPosition.toFixed(2)}`
          );
        } else {
          // Backward seek (replay)
          stats.replay_frequency++;
          stats.replay_duration += Math.abs(diff);

          // Track which section was replayed (the target section)
          const targetSectionIndex = Math.min(
            Math.floor(currentPosition / sectionSize),
            numSections - 1
          );
          sectionReplays[targetSectionIndex]++;

          console.log(
            `${
              interaction.interactionType === "seek"
                ? "Backward seek"
                : "Implicit backward seek"
            } (replay): ${Math.abs(diff).toFixed(
              2
            )}s from ${lastPosition.toFixed(2)} to ${currentPosition.toFixed(
              2
            )}`
          );
        }
      }
    }

    // Process speed changes
    if (
      interaction.interactionType === "speed" &&
      interaction.speed &&
      interaction.speed !== stats.average_speed
    ) {
      stats.speed_changes++;
      stats.average_speed = interaction.speed;
      console.log(`Speed changed to: ${stats.average_speed}x`);
    }

    // Update tracking variables for next iteration
    if (currentPosition !== null) {
      lastPosition = currentPosition;
    }
    lastTimestamp = currentTimestamp;
  }

  // Identify problematic sections
  const problematicSections = [];
  for (let i = 0; i < numSections; i++) {
    const sectionPauseCount = sectionPauses[i];
    const sectionReplayCount = sectionReplays[i];

    // Consider a section problematic if it has multiple pauses or any replays
    if (sectionPauseCount > 1 || sectionReplayCount > 0) {
      problematicSections.push({
        section: i,
        startTime: i * sectionSize,
        endTime: Math.min((i + 1) * sectionSize, videoDuration),
        pauseCount: sectionPauseCount,
        replayCount: sectionReplayCount,
        // Calculate difficulty score (weighted sum of pause and replay counts)
        difficulty: sectionPauseCount * 0.5 + sectionReplayCount * 1.5,
      });
    }
  }

  // Sort problematic sections by difficulty
  problematicSections.sort((a, b) => b.difficulty - a.difficulty);

  // Calculate derived metrics

  // Calculate median pause duration
  if (stats.pause_durations.length > 0) {
    const sortedDurations = [...stats.pause_durations].sort((a, b) => a - b);
    const middle = Math.floor(sortedDurations.length / 2);
    stats.pause_median_duration =
      sortedDurations.length % 2 === 0
        ? (sortedDurations[middle - 1] + sortedDurations[middle]) / 2
        : sortedDurations[middle];
  }

  // Calculate pause rate (pauses per minute)
  if (stats.session_duration > 0) {
    stats.pause_rate = stats.total_pauses / (stats.session_duration / 60);
    stats.replay_ratio = Math.min(
      stats.replay_duration / Math.max(stats.session_duration, 1),
      1
    );
  }

  // Log summary for debugging
  console.log("Interaction analysis summary:", {
    total_interactions: interactions.length,
    session_duration: `${stats.session_duration.toFixed(2)}s`,
    pauses: stats.total_pauses,
    seeks_forward: stats.seek_forward_frequency,
    seeks_backward: stats.replay_frequency,
    skipped_content: `${stats.skipped_content.toFixed(2)}s`,
    replay_duration: `${stats.replay_duration.toFixed(2)}s`,
    speed_changes: stats.speed_changes,
    average_speed: `${stats.average_speed.toFixed(2)}x`,
  });

  // Return final result with problematic sections
  return {
    session_duration: stats.session_duration,
    total_pauses: stats.total_pauses,
    pause_median_duration: stats.pause_median_duration || 0,
    replay_frequency: stats.replay_frequency,
    replay_duration: stats.replay_duration,
    seek_forward_frequency: stats.seek_forward_frequency,
    skipped_content: stats.skipped_content,
    speed_changes: stats.speed_changes,
    average_speed: stats.average_speed,
    pause_rate: stats.pause_rate || 0,
    replay_ratio: stats.replay_ratio || 0,
    problematic_sections: problematicSections.slice(0, 3), // Top 3 most difficult sections
  };
}

async function getRecommendationsForVideo(videoId, difficulty) {
  try {
    console.log(`Finding recommendations for difficulty: "${difficulty}"`);

    // Find the current video
    const mainVideo = await Video.findById(videoId);
    if (!mainVideo) {
      console.log("Video not found");
      return { video: null, resources: [] };
    }

    // Build resource query based on difficulty
    let resourceQuery = {};

    // Always filter by current video category if available
    if (mainVideo.category) {
      resourceQuery.tags = mainVideo.category;
    }

    // Adjust resource selection based on difficulty feedback
    if (difficulty === "difficult") {
      // For users finding content difficult, provide introductory/supplementary resources
      resourceQuery.recommendedFor = { $in: ["easy", "difficult"] };

      // Get more resources for difficult content
      const supplementaryResources = await Resource.find(resourceQuery).limit(
        3
      );

      // Find a simpler video on the same topic
      const easierVideo = await Video.findOne({
        category: mainVideo.category,
        difficultyLevel: "beginner",
        _id: { $ne: mainVideo._id },
      });

      return {
        video: easierVideo
          ? {
              ...easierVideo.toObject(),
              type: "video",
              url: `/api/videos/stream/${easierVideo._id}`,
            }
          : null,
        resources: supplementaryResources.map((resource) => ({
          ...resource.toObject(),
          type: resource.type,
          url:
            resource.type === "pdf"
              ? `/uploads/${path.basename(resource.filePath)}`
              : resource.url,
        })),
      };
    } else if (difficulty === "easy") {
      // For users finding content easy, provide more advanced resources
      resourceQuery.recommendedFor = { $in: ["justright", ""] };

      // Get challenging resources
      const advancedResources = await Resource.find(resourceQuery).limit(2);

      // Find a more challenging video on the same topic
      const harderVideo = await Video.findOne({
        category: mainVideo.category,
        difficultyLevel: { $in: ["intermediate", "advanced"] },
        _id: { $ne: mainVideo._id },
      });

      return {
        video: harderVideo
          ? {
              ...harderVideo.toObject(),
              type: "video",
              url: `/api/videos/stream/${harderVideo._id}`,
            }
          : null,
        resources: advancedResources.map((resource) => ({
          ...resource.toObject(),
          type: resource.type,
          url:
            resource.type === "pdf"
              ? `/uploads/${path.basename(resource.filePath)}`
              : resource.url,
        })),
      };
    } else {
      // For "just right" difficulty or no difficulty specified
      resourceQuery.recommendedFor = { $in: ["justright", ""] };

      // Get general resources
      const generalResources = await Resource.find(resourceQuery).limit(2);

      // Find a related video
      const relatedVideo = await Video.findOne({
        category: mainVideo.category,
        _id: { $ne: mainVideo._id },
      });

      return {
        video: relatedVideo
          ? {
              ...relatedVideo.toObject(),
              type: "video",
              url: `/api/videos/stream/${relatedVideo._id}`,
            }
          : null,
        resources: generalResources.map((resource) => ({
          ...resource.toObject(),
          type: resource.type,
          url:
            resource.type === "pdf"
              ? `/uploads/${path.basename(resource.filePath)}`
              : resource.url,
        })),
      };
    }
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return {
      message: "Error getting recommendations",
      video: null,
      resources: [],
    };
  }
}
