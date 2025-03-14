const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const Video = require("../models/Video");
const UserInteraction = require("../models/UserInteraction");
const Resource = require("../models/Resource");
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

// Create new video
exports.createVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a video file" });
    }

    const {
      title,
      description,
      category,
      difficultyLevel,
      isRecommendation,
      recommendedFor,
    } = req.body;

    // Create video entry in database
    const video = await Video.create({
      title,
      description,
      category: category || "general",
      difficultyLevel: difficultyLevel || "intermediate",
      filePath: req.file.path,
      thumbnailPath: req.body.thumbnailPath || "",
      isRecommendation: isRecommendation === "true",
      recommendedFor: recommendedFor || "",
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

// Submit difficulty feedback
exports.submitDifficultyFeedback = async (req, res) => {
  try {
    const { videoId, userId, perceivedDifficulty } = req.body;
    console.log(
      `User ${userId} feedback for video ${videoId}: ${perceivedDifficulty}`
    );

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Store the feedback in MongoDB
    let userInteraction = await UserInteraction.findOne({ userId, videoId });

    if (userInteraction) {
      userInteraction.userFeedback = perceivedDifficulty;
      await userInteraction.save();
    } else {
      userInteraction = await UserInteraction.create({
        userId,
        videoId,
        userFeedback: perceivedDifficulty,
      });
    }

    // If we have interaction data, update the model
    if (sessionInteractions[videoId] && sessionInteractions[videoId][userId]) {
      const interactions = sessionInteractions[videoId][userId];
      const interactionData = processInteractions(
        interactions,
        video.duration || 300
      );

      // Update the difficulty detection model with this feedback
      try {
        const updateResult = await difficultyService.updateModel(
          interactionData,
          perceivedDifficulty === "difficult" ? 1 : 0
        );
        console.log("Model update result:", updateResult);
      } catch (updateError) {
        console.error("Error updating model:", updateError);
        // Continue even if model update fails
      }
    }

    // Get recommendations for this difficulty level
    const difficulty =
      perceivedDifficulty === "difficult" ? "difficult" : "easy";
    const recommendations = await getRecommendationsForVideo(
      videoId,
      difficulty
    );

    res.json({
      message: "Feedback received and processed",
      recommendations,
      success: true,
    });
  } catch (error) {
    console.error("Error in submitDifficultyFeedback:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

// Get recommendations for a video
exports.getRecommendations = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { difficulty } = req.query;
    console.log(
      `Requested recommendations for video ${videoId} with difficulty: ${difficulty}`
    );

    const mainVideo = await Video.findById(videoId);
    if (!mainVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Get recommendation based on difficulty level
    const recommendedVideos = await Video.find({
      isRecommendation: true,
      recommendedFor: difficulty || "easy",
    }).limit(1);

    const recommendedResources = await Resource.find({
      recommendedFor: difficulty || "easy",
    }).limit(1);

    const response = {
      video:
        recommendedVideos.length > 0
          ? {
              ...recommendedVideos[0].toObject(),
              type: "video",
              url: `/uploads/${path.basename(recommendedVideos[0].filePath)}`,
            }
          : null,
      pdf:
        recommendedResources.length > 0 &&
        recommendedResources[0].type === "pdf"
          ? {
              ...recommendedResources[0].toObject(),
              type: "pdf",
              url: `/uploads/${path.basename(
                recommendedResources[0].filePath
              )}`,
            }
          : null,
    };

    console.log("Sending recommendations:", response);
    res.json(response);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      message: "Error getting recommendations",
      error: error.message,
      success: false,
    });
  }
};

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

// In videoController.js - enhance getRecommendationsForVideo helper function
async function getRecommendationsForVideo(videoId, difficulty) {
  try {
    console.log(`Finding recommendations for difficulty: "${difficulty}"`);

    // Find recommendation videos based on difficulty level
    let recommendedVideo = await Video.findOne({
      isRecommendation: true,
      recommendedFor: difficulty,
      _id: { $ne: videoId }, // Exclude current video
    });

    // Log query results for debugging
    console.log(
      `Found ${recommendedVideo ? "1" : "0"} matching video recommendations`
    );

    // If no specific recommendation found, get any recommendation video
    if (!recommendedVideo) {
      console.log(
        "No specific video recommendation found, getting any recommendation"
      );
      recommendedVideo = await Video.findOne({
        isRecommendation: true,
        _id: { $ne: videoId },
      });

      // If still nothing, get any video that's not the current one
      if (!recommendedVideo) {
        console.log("No recommendation videos at all, getting any other video");
        recommendedVideo = await Video.findOne({
          _id: { $ne: videoId },
        });
      }
    }

    // Find recommendation resources (PDFs) based on difficulty level
    let recommendedPDF = await Resource.findOne({
      type: "pdf",
      recommendedFor: difficulty,
    });

    console.log(
      `Found ${recommendedPDF ? "1" : "0"} matching PDF recommendations`
    );

    // If no specific PDF found, get any PDF
    if (!recommendedPDF) {
      console.log("No specific PDF recommendation found, getting any PDF");
      recommendedPDF = await Resource.findOne({
        type: "pdf",
      });
    }

    // Format response
    return {
      video: recommendedVideo
        ? {
            ...recommendedVideo.toObject(),
            type: "video",
            url: `/api/videos/stream/${recommendedVideo._id}`,
          }
        : null,
      pdf: recommendedPDF
        ? {
            ...recommendedPDF.toObject(),
            type: "pdf",
            url: `/uploads/${path.basename(recommendedPDF.filePath)}`,
          }
        : null,
    };
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return {
      message: "Error getting recommendations",
      video: null,
      pdf: null,
    };
  }
}
