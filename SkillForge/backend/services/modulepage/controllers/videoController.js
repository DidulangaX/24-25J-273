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

let sessionInteractions = {};
const difficultyService = new DifficultyDetectionService();

const cleanupOldInteractions = () => {
  const cutoffTime = Date.now() - 30 * 60 * 1000;
  for (const videoId in sessionInteractions) {
    for (const userId in sessionInteractions[videoId]) {
      sessionInteractions[videoId][userId] = sessionInteractions[videoId][
        userId
      ].filter(
        (interaction) => new Date(interaction.timestamp).getTime() > cutoffTime
      );
      if (sessionInteractions[videoId][userId].length === 0) {
        delete sessionInteractions[videoId][userId];
      }
    }
    if (Object.keys(sessionInteractions[videoId]).length === 0) {
      delete sessionInteractions[videoId];
    }
  }
  console.log("Cleaned up old interactions");
};

setInterval(cleanupOldInteractions, 5 * 60 * 1000);

// Get all videos
const getVideos = async (req, res) => {
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
const getMainVideos = async (req, res) => {
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

// Get video by ID
const getVideoById = async (req, res) => {
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

// Create video
const createVideo = async (req, res) => {
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
      sequenceId,
      sequencePosition,
      level,
      tags,
      prerequisites,
    } = req.body;

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

    if (sequenceId) videoData.sequenceId = sequenceId;
    if (sequencePosition)
      videoData.sequencePosition = parseInt(sequencePosition, 10);
    if (level) videoData.level = parseInt(level, 10);

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

    const video = await Video.create(videoData);
    console.log(`Created video: ${video.title} with ID ${video._id}`);
    res.status(201).json(video);
  } catch (error) {
    console.error("Error creating video:", error);
    res
      .status(500)
      .json({ message: "Error creating video", error: error.message });
  }
};

// Update video
const updateVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`Attempting to update video with ID: ${videoId}`);

    const existingVideo = await Video.findById(videoId);
    if (!existingVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    const updateData = {
      title: req.body.title || existingVideo.title,
      description: req.body.description || existingVideo.description,
      category: req.body.category || existingVideo.category,
      difficultyLevel:
        req.body.difficultyLevel || existingVideo.difficultyLevel,
      sequenceId: req.body.sequenceId || existingVideo.sequenceId,
      sequencePosition: req.body.sequencePosition
        ? parseInt(req.body.sequencePosition, 10)
        : existingVideo.sequencePosition,
      level: req.body.level
        ? parseInt(req.body.level, 10)
        : existingVideo.level,
    };

    if (req.body.tags) {
      if (typeof req.body.tags === "string") {
        updateData.tags = req.body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      }
    }

    if (req.body.prerequisites) {
      try {
        if (typeof req.body.prerequisites === "string") {
          updateData.prerequisites = JSON.parse(req.body.prerequisites);
        } else if (Array.isArray(req.body.prerequisites)) {
          updateData.prerequisites = req.body.prerequisites;
        }
      } catch (parseError) {
        console.error("Error parsing prerequisites:", parseError);
      }
    }

    if (req.file) {
      console.log("New video file detected:", req.file.path);
      const oldFilePath = existingVideo.filePath;
      updateData.filePath = req.file.path;

      if (oldFilePath && oldFilePath !== req.file.path) {
        try {
          if (fs.existsSync(oldFilePath)) {
            console.log(`Deleting old video file: ${oldFilePath}`);
            fs.unlinkSync(oldFilePath);
          }
        } catch (fileError) {
          console.error("Error deleting old video file:", fileError);
        }
      }
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
      new: true,
    });
    res.json(updatedVideo);
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({
      message: "Error updating video",
      error: error.message,
    });
  }
};

// Delete video
const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`Attempting to delete video with ID: ${videoId}`);

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.filePath) {
      try {
        if (fs.existsSync(video.filePath)) {
          console.log(`Deleting video file: ${video.filePath}`);
          fs.unlinkSync(video.filePath);
        }
      } catch (fileError) {
        console.error("Error deleting video file:", fileError);
      }
    }

    await Video.findByIdAndDelete(videoId);
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({
      message: "Error deleting video",
      error: error.message,
    });
  }
};

// Stream video
const streamVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`Attempting to stream video with ID: ${videoId}`);

    const video = await Video.findById(videoId);
    if (!video) {
      console.log(`Video not found for ID: ${videoId}`);
      return res.status(404).send("Video not found");
    }

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

// Get recommendations
const getRecommendations = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { difficulty } = req.query;

    console.log(
      `Getting recommendations for video ${videoId} with difficulty ${difficulty}`
    );

    const mainVideo = await Video.findById(videoId);
    if (!mainVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    const recommendedVideos = await Video.find({
      isRecommendation: true,
      recommendedFor: difficulty || "easy",
      _id: { $ne: videoId },
    }).limit(3);

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

    const recommendedResources = await Resource.find({
      recommendedFor: difficulty || "easy",
    }).limit(2);

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

// Track interaction
const trackInteraction = (req, res) => {
  const { videoId, userId, interactionType, position, timestamp, ...metadata } =
    req.body;

  if (!videoId || !userId || !interactionType) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: videoId, userId, or interactionType",
    });
  }

  console.log(
    `Enhanced tracking: ${interactionType} for user ${userId} on video ${videoId} at position ${
      position || "unknown"
    }`
  );

  if (!sessionInteractions[videoId]) {
    sessionInteractions[videoId] = {};
  }
  if (!sessionInteractions[videoId][userId]) {
    sessionInteractions[videoId][userId] = [];
  }

  const newInteraction = {
    interactionType,
    position: position !== undefined ? position : null,
    timestamp: timestamp || new Date().toISOString(),
    ...metadata,
  };

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

// Enhanced processInteractions function
const processInteractions = (interactions, videoDuration) => {
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
      tab_switch_frequency: 0,
      total_inactivity_time: 0,
      inactivity_ratio: 0,
      tab_visibility_ratio: 1.0,
      session_exit_attempts: 0,
      active_viewing_ratio: 1.0,
    };
  }

  console.log(`Processing ${interactions.length} interactions`);

  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

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
    tab_switches: 0,
    total_hidden_time: 0,
    total_inactive_time: 0,
    session_exit_attempts: 0,
  };

  let lastPosition = null;
  let lastTimestamp = new Date(sortedInteractions[0].timestamp);
  let pauseStartTime = null;
  let tabHiddenStartTime = null;
  let userInactiveStartTime = null;

  const sectionSize = 10;
  const numSections = Math.ceil(videoDuration / sectionSize);
  const sectionPauses = new Array(numSections).fill(0);
  const sectionReplays = new Array(numSections).fill(0);

  for (let i = 0; i < sortedInteractions.length; i++) {
    const interaction = sortedInteractions[i];
    const currentPosition =
      interaction.position !== undefined ? interaction.position : null;
    const currentTimestamp = new Date(interaction.timestamp);

    if (i > 0) {
      const timeDiff = (currentTimestamp - lastTimestamp) / 1000;
      stats.session_duration += timeDiff;
    }

    switch (interaction.interactionType) {
      case "pause":
        const sectionIndexPause =
          currentPosition !== null
            ? Math.min(
                Math.floor(currentPosition / sectionSize),
                numSections - 1
              )
            : 0;
        sectionPauses[sectionIndexPause]++;
        stats.total_pauses++;
        pauseStartTime = currentTimestamp;
        break;

      case "play":
        if (pauseStartTime) {
          const pauseDuration = (currentTimestamp - pauseStartTime) / 1000;
          if (pauseDuration >= 0.5) {
            stats.pause_durations.push(pauseDuration);
          }
          pauseStartTime = null;
        }
        break;

      case "seek":
        if (lastPosition !== null && currentPosition !== null) {
          const diff = currentPosition - lastPosition;
          if (Math.abs(diff) > 0.5) {
            if (diff > 0) {
              stats.seek_forward_frequency++;
              stats.skipped_content += diff;
            } else {
              stats.replay_frequency++;
              stats.replay_duration += Math.abs(diff);
              const targetSectionIndex = Math.min(
                Math.floor(currentPosition / sectionSize),
                numSections - 1
              );
              sectionReplays[targetSectionIndex]++;
            }
          }
        }
        break;

      case "speed":
        if (interaction.speed && interaction.speed !== stats.average_speed) {
          stats.speed_changes++;
          stats.average_speed = interaction.speed;
        }
        break;

      case "tab_unfocused":
        stats.tab_switches++;
        tabHiddenStartTime = currentTimestamp;
        break;

      case "tab_focused":
        if (tabHiddenStartTime) {
          const hiddenDuration = (currentTimestamp - tabHiddenStartTime) / 1000;
          stats.total_hidden_time += hiddenDuration;
          tabHiddenStartTime = null;
        }
        break;

      case "user_inactive":
        userInactiveStartTime = currentTimestamp;
        break;

      case "activity_resumed":
        if (userInactiveStartTime) {
          const inactiveDuration =
            (currentTimestamp - userInactiveStartTime) / 1000;
          stats.total_inactive_time += inactiveDuration;
          userInactiveStartTime = null;
        }
        break;

      case "exit_attempt":
        stats.session_exit_attempts++;
        break;
    }

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

    if (sectionPauseCount > 1 || sectionReplayCount > 0) {
      problematicSections.push({
        section: i,
        startTime: i * sectionSize,
        endTime: Math.min((i + 1) * sectionSize, videoDuration),
        pauseCount: sectionPauseCount,
        replayCount: sectionReplayCount,
        difficulty: sectionPauseCount * 0.5 + sectionReplayCount * 1.5,
      });
    }
  }

  problematicSections.sort((a, b) => b.difficulty - a.difficulty);

  // Calculate median pause duration
  if (stats.pause_durations.length > 0) {
    const sortedDurations = [...stats.pause_durations].sort((a, b) => a - b);
    const middle = Math.floor(sortedDurations.length / 2);
    stats.pause_median_duration =
      sortedDurations.length % 2 === 0
        ? (sortedDurations[middle - 1] + sortedDurations[middle]) / 2
        : sortedDurations[middle];
  }

  // Calculate derived metrics
  const minutes_watched = Math.max(stats.session_duration / 60, 0.1);
  const pause_rate = stats.total_pauses / minutes_watched;
  const replay_ratio =
    stats.session_duration > 0
      ? Math.min(stats.replay_duration / stats.session_duration, 1)
      : 0;
  const tab_visibility_ratio =
    stats.session_duration > 0
      ? Math.max(1 - stats.total_hidden_time / stats.session_duration, 0)
      : 1.0;
  const active_viewing_ratio =
    stats.session_duration > 0
      ? Math.max(1 - stats.total_inactive_time / stats.session_duration, 0)
      : 1.0;
  const tab_switch_frequency = stats.tab_switches / minutes_watched;
  const inactivity_ratio =
    stats.session_duration > 0
      ? stats.total_inactive_time / stats.session_duration
      : 0;

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
    tab_switches: stats.tab_switches,
    total_hidden_time: `${stats.total_hidden_time.toFixed(2)}s`,
    total_inactive_time: `${stats.total_inactive_time.toFixed(2)}s`,
    exit_attempts: stats.session_exit_attempts,
  });

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
    pause_rate: pause_rate,
    replay_ratio: replay_ratio,
    tab_switch_frequency: tab_switch_frequency,
    total_inactivity_time: stats.total_inactive_time,
    inactivity_ratio: inactivity_ratio,
    tab_visibility_ratio: tab_visibility_ratio,
    session_exit_attempts: stats.session_exit_attempts,
    active_viewing_ratio: active_viewing_ratio,
    problematic_sections: problematicSections.slice(0, 3),
  };
};

// Detect difficulty
const detectDifficulty = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body;

    if (!videoId || !userId) {
      return res.status(400).json({
        message: "Missing required parameters",
        success: false,
      });
    }

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

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        message: "Video not found",
        success: false,
      });
    }

    const interactions = sessionInteractions[videoId][userId];
    const interactionData = processInteractions(
      interactions,
      video.duration || 300
    );

    console.log(
      "Processed interaction data for difficulty detection:",
      interactionData
    );

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(
      tempDir,
      `interaction_data_${Date.now()}.json`
    );
    fs.writeFileSync(tempFilePath, JSON.stringify(interactionData));

    const pythonScriptPath = path.join(
      __dirname,
      "../utils/difficulty_detector_model.py"
    );
    console.log(
      `Running Python script: ${pythonScriptPath} with data from ${tempFilePath}`
    );

    const pythonProcess = spawn("python", [pythonScriptPath, tempFilePath]);

    let predictionData = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      predictionData += data.toString();
      console.log(`Python stdout: ${data.toString()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error(`Python stderr: ${data.toString()}`);
    });

    pythonProcess.on("close", async (code) => {
      console.log(`Python process exited with code ${code}`);

      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }

      try {
        let prediction;
        if (predictionData) {
          try {
            prediction = JSON.parse(predictionData);
          } catch (parseError) {
            console.error("Error parsing prediction data:", parseError);
            prediction = {
              predicted_difficulty: 0,
              confidence: 0.5,
              insights: ["Error parsing prediction data"],
            };
          }
        } else {
          prediction = {
            predicted_difficulty: 0,
            confidence: 0.5,
            insights: ["No prediction data received"],
          };
        }

        const recommendations = [];

        if (
          interactionData.problematic_sections &&
          interactionData.problematic_sections.length > 0
        ) {
          const difficultSections = interactionData.problematic_sections;

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

        if (prediction.predicted_difficulty === 1) {
          if (interactionData.replay_frequency > 2) {
            recommendations.push(
              "Try taking notes during your viewing to reinforce key concepts."
            );
          }
          if (interactionData.pause_rate > 3) {
            recommendations.push(
              "Consider reviewing prerequisite content before continuing."
            );
          }
          if (interactionData.tab_switch_frequency > 2) {
            recommendations.push(
              "We noticed you frequently switched tabs. Try our supplementary resources for clearer explanations."
            );
          }
        } else {
          if (interactionData.seek_forward_frequency > 3) {
            recommendations.push(
              "You're advancing quickly - consider exploring more challenging content"
            );
          }
        }

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

// Helper function to format time
function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Submit difficulty feedback
const submitDifficultyFeedback = async (req, res) => {
  try {
    const { videoId, userId, perceivedDifficulty, comments } = req.body;
    console.log(
      `User ${userId} feedback for video ${videoId}: ${perceivedDifficulty}`
    );

    if (!videoId || !userId || !perceivedDifficulty) {
      return res.status(400).json({
        message:
          "Missing required fields: videoId, userId, or perceivedDifficulty",
        success: false,
      });
    }

    if (!["easy", "justright", "difficult"].includes(perceivedDifficulty)) {
      return res.status(400).json({
        message:
          "Invalid difficulty level. Must be 'easy', 'justright', or 'difficult'",
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

    const recommendationResponse = {
      resources: [],
      nextVideo: null,
      learningPath: [],
      difficulty: perceivedDifficulty,
    };

    let resourceQuery = {
      recommendedFor: perceivedDifficulty,
    };

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

    let videoQuery = { _id: { $ne: videoId } };

    if (perceivedDifficulty === "difficult") {
      videoQuery.difficultyLevel = "beginner";
    } else if (perceivedDifficulty === "easy") {
      videoQuery.difficultyLevel = "advanced";
    } else {
      videoQuery.difficultyLevel = video.difficultyLevel || "intermediate";
    }

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

    let pathQuery = { _id: { $ne: videoId } };
    if (perceivedDifficulty === "difficult") {
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

// Get model recommendations
const getModelRecommendations = async (req, res) => {
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

    let predictedDifficulty = "easy";
    let confidenceScore = 0.5;
    let insightMessage = "Based on limited viewing data";

    if (sessionInteractions[videoId] && sessionInteractions[videoId][userId]) {
      const interactions = sessionInteractions[videoId][userId];
      if (interactions.length >= 3) {
        const interactionData = processInteractions(
          interactions,
          video.duration || 300
        );
        console.log("Processed interaction data:", interactionData);

        try {
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
        }
      } else {
        console.log(
          "Not enough interactions for reliable prediction, using defaults"
        );
      }
    }

    const recommendations = await getRecommendationsForVideo(
      videoId,
      predictedDifficulty
    );

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

// Helper function to get recommendations for video
async function getRecommendationsForVideo(videoId, difficulty) {
  try {
    console.log(
      `Finding recommendations for difficulty level: "${difficulty}"`
    );

    const result = {
      video: null,
      resources: [],
    };

    const mainVideo = await Video.findById(videoId);
    if (!mainVideo) {
      console.log("Video not found");
      return result;
    }

    try {
      let resourceQuery = {};
      if (difficulty) {
        if (difficulty === "difficult") {
          resourceQuery.$or = [
            { recommendedFor: "difficult" },
            { recommendedFor: "easy" },
          ];
        } else if (difficulty === "easy") {
          resourceQuery.$or = [
            { recommendedFor: "easy" },
            { recommendedFor: "justright" },
            { recommendedFor: "advanced" },
          ];
        } else {
          resourceQuery.$or = [{ recommendedFor: "justright" }];
        }
      }

      if (mainVideo.category && mainVideo.category !== "general") {
        resourceQuery.category = mainVideo.category;
      }

      console.log("Resource query:", JSON.stringify(resourceQuery));

      let resources = await Resource.find(resourceQuery).limit(3);
      console.log(
        `Found ${resources.length} resources matching difficulty criteria`
      );

      if (!resources || resources.length === 0) {
        console.log("No specific resources found, getting general resources");
        const generalResources = await Resource.find({}).limit(3);
        if (generalResources && generalResources.length > 0) {
          resources = generalResources;
          console.log(`Found ${generalResources.length} general resources`);
        }
      }

      if (resources && resources.length > 0) {
        result.resources = resources.map(formatResource);
      }
    } catch (resourceError) {
      console.error("Error finding resources:", resourceError);
    }

    try {
      let videoQuery = {
        _id: { $ne: videoId },
      };

      if (mainVideo.category) {
        videoQuery.category = mainVideo.category;
      }

      if (difficulty === "difficult") {
        videoQuery.difficultyLevel = "beginner";
      } else if (difficulty === "easy") {
        videoQuery.difficultyLevel = "advanced";
      }

      console.log("Video query:", JSON.stringify(videoQuery));

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

    console.log(
      `Returning ${result.resources.length} resources and ${
        result.video ? "1" : "0"
      } videos`
    );
    return result;
  } catch (error) {
    console.error("Error in getRecommendationsForVideo:", error);
    return {
      video: null,
      resources: [],
    };
  }
}

// Format resource for response
function formatResource(resource) {
  if (!resource) return null;

  const formattedResource = {
    _id: resource._id ? resource._id.toString() : `resource-${Date.now()}`,
    title: resource.title || "Learning Resource",
    description: resource.description || "Additional learning material",
    type: resource.type || "text",
    url: "",
  };

  try {
    if (resource.type === "pdf" && resource.filePath) {
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

// End session
const endSession = async (req, res) => {
  try {
    const { videoId, userId } = req.body;
    if (!videoId || !userId) {
      return res.status(400).json({
        message: "Missing videoId or userId",
        success: false,
      });
    }

    console.log(`Ending session for user ${userId} on video ${videoId}`);

    if (
      !sessionInteractions[videoId] ||
      !sessionInteractions[videoId][userId]
    ) {
      return res.status(200).json({
        message: "No session data found",
        success: true,
      });
    }

    const interactions = sessionInteractions[videoId][userId];
    if (interactions.length === 0) {
      return res.status(200).json({
        message: "No interactions recorded",
        success: true,
      });
    }

    const summary = processInteractions(interactions, 300);

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

// Clear session
const clearSession = async (req, res) => {
  try {
    const { videoId, userId } = req.body;
    if (!videoId || !userId) {
      return res.status(400).json({
        message: "Missing videoId or userId",
        success: false,
      });
    }

    console.log(`Clearing session for user ${userId} on video ${videoId}`);

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

// Generate insights
const generateInsights = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId, sessionData } = req.body;

    let interactionData;
    if (sessionData) {
      interactionData = sessionData;
    } else if (
      sessionInteractions[videoId] &&
      sessionInteractions[videoId][userId]
    ) {
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

// Record tab switch feedback
const recordTabSwitchFeedback = async (req, res) => {
  try {
    const { videoId, userId, reason, position, timestamp } = req.body;
    if (!videoId || !userId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    let userInteraction = await UserInteraction.findOne({ userId, videoId });
    if (userInteraction) {
      if (!userInteraction.tabSwitchFeedback) {
        userInteraction.tabSwitchFeedback = [];
      }
      userInteraction.tabSwitchFeedback.push({
        reason,
        position,
        timestamp: timestamp || Date.now(),
      });
      userInteraction.updatedAt = Date.now();
      await userInteraction.save();
    } else {
      userInteraction = await UserInteraction.create({
        userId,
        videoId,
        tabSwitchFeedback: [
          {
            reason,
            position,
            timestamp: timestamp || Date.now(),
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      message: "Tab switch feedback recorded",
    });
  } catch (error) {
    console.error("Error recording tab switch feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error recording tab switch feedback",
      error: error.message,
    });
  }
};

// Get user sessions
const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId parameter",
      });
    }

    const interactions = await UserInteraction.find({ userId })
      .select("videoId userFeedback pauseCount replayCount completionRatio")
      .lean();

    const videoIds = interactions.map((i) => i.videoId);
    const videos = await Video.find({ _id: { $in: videoIds } })
      .select("title difficultyLevel category sequenceId sequencePosition")
      .lean();

    const videoMap = videos.reduce((map, video) => {
      map[video._id.toString()] = video;
      return map;
    }, {});

    const sessions = interactions.map((interaction) => {
      const videoId = interaction.videoId.toString();
      const video = videoMap[videoId] || {};
      return {
        videoId,
        title: video.title || "Unknown Video",
        difficultyLevel: video.difficultyLevel,
        category: video.category,
        sequenceId: video.sequenceId,
        sequencePosition: video.sequencePosition,
        userFeedback: interaction.userFeedback,
        pauseCount: interaction.pauseCount,
        replayCount: interaction.replayCount,
        completionRatio: interaction.completionRatio || 0,
      };
    });

    res.status(200).json({
      success: true,
      userId,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving user sessions",
      error: error.message,
    });
  }
};

// Get sequence videos
const getSequenceVideos = async (req, res) => {
  try {
    const { sequenceId } = req.params;
    if (!sequenceId) {
      return res.status(400).json({
        success: false,
        message: "Missing sequenceId parameter",
      });
    }

    const videos = await Video.find({ sequenceId })
      .sort("sequencePosition")
      .select(
        "title description category difficultyLevel level sequencePosition thumbnailPath"
      );

    res.status(200).json({
      success: true,
      sequenceId,
      videos,
    });
  } catch (error) {
    console.error("Error fetching sequence videos:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving sequence videos",
      error: error.message,
    });
  }
};

// Export all functions
module.exports = {
  getVideos,
  getMainVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  streamVideo,
  getRecommendations,
  trackInteraction,
  detectDifficulty,
  submitDifficultyFeedback,
  getModelRecommendations,
  endSession,
  clearSession,
  generateInsights,
  recordTabSwitchFeedback,
  getUserSessions,
  getSequenceVideos,
};
