// controllers/recommendationController.js

const Video = require("../models/Video");
const Resource = require("../models/Resource");
const UserInteraction = require("../models/UserInteraction");

/**
 * Advanced personalized recommendation system that generates
 * recommendations based on user's specific difficulties,
 * interaction patterns, and content relationships
 */
class RecommendationEngine {
  /**
   * Generate personalized recommendations based on user feedback and interaction data
   *
   * @param {string} videoId - Current video ID
   * @param {string} userId - User ID
   * @param {string} difficultyLevel - User-reported difficulty (easy, justright, difficult)
   * @param {Object} interactionData - User interaction data with the video
   * @returns {Promise<Object>} - Personalized recommendations
   */
  async getPersonalizedRecommendations(
    videoId,
    userId,
    difficultyLevel,
    interactionData = null
  ) {
    try {
      console.log(
        `Generating personalized recommendations for user ${userId} on video ${videoId}`
      );
      console.log(`User reported difficulty: ${difficultyLevel}`);

      // Get the current video
      const currentVideo = await Video.findById(videoId);
      if (!currentVideo) {
        return { success: false, message: "Video not found" };
      }

      // Get user's past interactions to understand their learning patterns
      const userHistory = await UserInteraction.find({ userId });

      // Build personalization profile
      const userProfile = this._buildUserProfile(userHistory, interactionData);
      console.log("User profile built:", userProfile);

      // Get resources based on difficulty and current video topic
      const resources = await this._findRelevantResources(
        currentVideo,
        difficultyLevel,
        userProfile
      );

      // Find appropriate next video based on learning path
      const nextVideo = await this._findNextVideo(
        currentVideo,
        difficultyLevel,
        userProfile
      );

      // Get section-specific resources if there's interaction data with problematic sections
      let sectionResources = [];
      if (interactionData && interactionData.problematic_sections) {
        sectionResources = await this._findSectionResources(
          videoId,
          interactionData.problematic_sections
        );
      }

      // Combine all resources and remove duplicates
      const allResources = [...resources, ...sectionResources];
      const uniqueResources = this._removeDuplicateResources(allResources);

      // Generate learning path suggestions based on user's progress
      const learningPath = await this._generateLearningPath(
        currentVideo,
        userProfile,
        difficultyLevel
      );

      // Return comprehensive recommendation package
      return {
        success: true,
        recommendations: {
          resources: uniqueResources,
          nextVideo: nextVideo,
          learningPath: learningPath,
          difficulty: difficultyLevel,
        },
      };
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      return {
        success: false,
        message: "Failed to generate recommendations",
        error: error.message,
      };
    }
  }

  /**
   * Build a user profile based on their learning history and current interactions
   * @param {Array} userHistory - Past user interactions
   * @param {Object} currentInteractions - Current interaction data
   * @returns {Object} - User profile with learning patterns
   */
  _buildUserProfile(userHistory, currentInteractions) {
    // Initialize profile with defaults
    const profile = {
      preferredContentTypes: [],
      struggleAreas: [],
      strengths: [],
      averagePaceMinutes: 0,
      completionRate: 0,
      learningStyle: "unknown",
    };

    // No history yet, return default profile
    if (!userHistory || userHistory.length === 0) {
      return profile;
    }

    // Analyze user history to identify patterns
    const totalVideos = userHistory.length;
    let totalDuration = 0;
    let completedVideos = 0;

    // Count content type preferences
    const contentTypeCount = {};
    const difficultyByCategory = {};

    userHistory.forEach((interaction) => {
      // Track video completion
      if (interaction.watchedDuration && interaction.totalDuration) {
        const completion =
          interaction.watchedDuration / interaction.totalDuration;
        totalDuration += interaction.totalDuration || 0;
        if (completion > 0.8) completedVideos++;
      }

      // Track user feedback by category to find struggle areas
      if (interaction.videoMetadata && interaction.videoMetadata.category) {
        const category = interaction.videoMetadata.category;

        // Initialize category tracking
        if (!difficultyByCategory[category]) {
          difficultyByCategory[category] = {
            difficultCount: 0,
            easyCount: 0,
            totalCount: 0,
          };
        }

        difficultyByCategory[category].totalCount++;

        // Track difficulty feedback by category
        if (interaction.userFeedback === "difficult") {
          difficultyByCategory[category].difficultCount++;
        } else if (interaction.userFeedback === "easy") {
          difficultyByCategory[category].easyCount++;
        }
      }

      // Track resource usage
      if (
        interaction.resourcesAccessed &&
        interaction.resourcesAccessed.length > 0
      ) {
        interaction.resourcesAccessed.forEach((resource) => {
          if (!contentTypeCount[resource.type]) {
            contentTypeCount[resource.type] = 0;
          }
          contentTypeCount[resource.type]++;
        });
      }
    });

    // Determine preferred content types
    profile.preferredContentTypes = Object.entries(contentTypeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map((entry) => entry[0]);

    // Identify struggle areas (categories with high difficult ratings)
    profile.struggleAreas = Object.entries(difficultyByCategory)
      .filter(
        ([_, data]) =>
          data.totalCount > 0 && data.difficultCount / data.totalCount > 0.5
      )
      .map(([category, _]) => category);

    // Identify strength areas (categories with high easy ratings)
    profile.strengths = Object.entries(difficultyByCategory)
      .filter(
        ([_, data]) =>
          data.totalCount > 0 && data.easyCount / data.totalCount > 0.6
      )
      .map(([category, _]) => category);

    // Calculate average pace and completion rate
    if (totalVideos > 0) {
      profile.averagePaceMinutes = totalDuration / totalVideos / 60; // convert to minutes
      profile.completionRate = completedVideos / totalVideos;
    }

    // Determine learning style based on interaction patterns
    profile.learningStyle = this._determineLearningStyle(
      userHistory,
      currentInteractions
    );

    return profile;
  }

  /**
   * Determine the user's learning style based on their interaction patterns
   * @param {Array} userHistory - Past user interactions
   * @param {Object} currentInteractions - Current interaction data
   * @returns {string} - Learning style identifier
   */
  _determineLearningStyle(userHistory, currentInteractions) {
    // Default to balanced if we don't have enough data
    if (!userHistory || userHistory.length < 3) return "balanced";

    // Count different types of interactions
    let pauseCount = 0;
    let replayCount = 0;
    let skipCount = 0;
    let resourceAccessCount = 0;
    let totalInteractions = 0;

    // Analyze historical interactions
    userHistory.forEach((interaction) => {
      pauseCount += interaction.pauseCount || 0;
      replayCount += interaction.replayCount || 0;
      skipCount += interaction.skipCount || 0;
      resourceAccessCount += interaction.resourcesAccessed?.length || 0;
      totalInteractions++;
    });

    // Add current interaction data if available
    if (currentInteractions) {
      pauseCount += currentInteractions.total_pauses || 0;
      replayCount += currentInteractions.replay_frequency || 0;
      skipCount += currentInteractions.seek_forward_frequency || 0;
      totalInteractions++;
    }

    // Calculate average interactions per session
    const avgPauses = pauseCount / totalInteractions;
    const avgReplays = replayCount / totalInteractions;
    const avgSkips = skipCount / totalInteractions;
    const avgResourceAccess = resourceAccessCount / totalInteractions;

    // Determine learning style based on interaction patterns
    if (avgPauses > 8 && avgReplays > 3) {
      return "methodical"; // Careful, thorough learner
    } else if (avgSkips > 5 && avgPauses < 3) {
      return "scanner"; // Quick browsing, focuses on specific parts
    } else if (avgResourceAccess > 2) {
      return "researcher"; // Likes to explore additional materials
    } else if (avgReplays > 5 && avgResourceAccess > 1) {
      return "reinforcer"; // Needs multiple exposures to content
    } else {
      return "balanced"; // No strong pattern detected
    }
  }

  /**
   * Find relevant resources based on video metadata and user difficulty
   * @param {Object} video - Current video
   * @param {string} difficultyLevel - User-reported difficulty
   * @param {Object} userProfile - User learning profile
   * @returns {Promise<Array>} - Relevant resources
   */
  async _findRelevantResources(video, difficultyLevel, userProfile) {
    // Build query based on video and user profile
    const query = {};

    // Base query on video metadata
    if (video.category) {
      query.$or = [
        { category: video.category },
        { tags: { $in: [video.category] } },
      ];
    }

    // Adjust based on reported difficulty
    if (difficultyLevel === "difficult") {
      // For difficult content, provide supplementary explanatory materials
      query.recommendedFor = { $in: ["difficult", "justright"] };

      // If user has preferred content types, prioritize those
      if (userProfile.preferredContentTypes.length > 0) {
        query.$or = query.$or || [];
        query.$or.push({ type: { $in: userProfile.preferredContentTypes } });
      }
    } else if (difficultyLevel === "easy") {
      // For easy content, provide advanced materials
      query.recommendedFor = "easy";

      // For users finding content easy, possibly provide advanced related topics
      if (video.tags && video.tags.length > 0) {
        query.$or = query.$or || [];
        query.$or.push({ tags: { $in: video.tags } });
      }
    } else {
      // For "just right" content, provide balanced resources
      query.recommendedFor = "justright";
    }

    console.log("Resource query:", JSON.stringify(query));

    // Execute query with sorting and limits
    let resources = await Resource.find(query)
      .sort({ createdAt: -1 }) // Newer resources first
      .limit(4);

    // If no resources found with specific query, fall back to more general query
    if (resources.length === 0) {
      console.log("No specific resources found, using fallback query");
      const fallbackQuery = video.category
        ? {
            $or: [
              { category: video.category },
              { tags: { $in: [video.category] } },
            ],
          }
        : {};

      resources = await Resource.find(fallbackQuery).limit(3);
    }

    // Format resources for response
    return resources.map((resource) => this._formatResource(resource));
  }

  /**
   * Find section-specific resources for problematic video sections
   * @param {string} videoId - Current video ID
   * @param {Array} problematicSections - Sections user struggled with
   * @returns {Promise<Array>} - Section-specific resources
   */
  async _findSectionResources(videoId, problematicSections) {
    if (!problematicSections || problematicSections.length === 0) {
      return [];
    }

    // Get resources specifically tagged for this video
    const videoResources = await Resource.find({ videoId });
    if (videoResources.length === 0) return [];

    // Match resources to problematic sections
    const matchedResources = [];

    problematicSections.forEach((section) => {
      const sectionStart = section.startTime;
      const sectionEnd = section.endTime;

      // Find resources that cover this section
      const sectionResources = videoResources.filter((resource) => {
        // If resource has section markers, check for overlap
        if (
          resource.sectionStart !== undefined &&
          resource.sectionEnd !== undefined
        ) {
          return (
            (resource.sectionStart <= sectionEnd &&
              resource.sectionEnd >= sectionStart) ||
            (resource.sectionStart <= sectionStart &&
              resource.sectionEnd >= sectionStart)
          );
        }
        return false;
      });

      // Add matching resources with section info
      sectionResources.forEach((resource) => {
        const formattedResource = this._formatResource(resource);
        formattedResource.matchedSection = {
          start: sectionStart,
          end: sectionEnd,
          replayCount: section.replayCount || 0,
          pauseCount: section.pauseCount || 0,
        };
        matchedResources.push(formattedResource);
      });
    });

    return matchedResources;
  }

  /**
   * Find the most appropriate next video based on learning path
   * @param {Object} currentVideo - Current video
   * @param {string} difficultyLevel - User-reported difficulty
   * @param {Object} userProfile - User learning profile
   * @returns {Promise<Object>} - Next recommended video
   */
  async _findNextVideo(currentVideo, difficultyLevel, userProfile) {
    // Base query excludes current video
    const query = { _id: { $ne: currentVideo._id } };

    // If video has a specific sequence, try to follow it
    if (
      currentVideo.sequenceId &&
      currentVideo.sequencePosition !== undefined
    ) {
      const nextSequenceVideo = await Video.findOne({
        sequenceId: currentVideo.sequenceId,
        sequencePosition: currentVideo.sequencePosition + 1,
      });

      if (nextSequenceVideo) {
        return this._formatVideo(nextSequenceVideo);
      }
    }

    // If no sequence or next in sequence not found, use category and difficulty
    if (currentVideo.category) {
      query.category = currentVideo.category;
    }

    // Adjust difficulty based on user feedback
    if (difficultyLevel === "difficult") {
      // If user found it difficult, recommend easier content on same topic
      query.difficultyLevel = "beginner";
    } else if (difficultyLevel === "easy") {
      // If user found it easy, recommend more advanced content
      query.difficultyLevel = { $in: ["intermediate", "advanced"] };
    } else {
      // For "just right", find similar difficulty
      query.difficultyLevel = currentVideo.difficultyLevel || "intermediate";
    }

    // If user has struggle areas, avoid them unless current video is in that area
    if (userProfile.struggleAreas && userProfile.struggleAreas.length > 0) {
      if (
        !currentVideo.category ||
        !userProfile.struggleAreas.includes(currentVideo.category)
      ) {
        query.category = { $nin: userProfile.struggleAreas };
      }
    }

    console.log("Next video query:", JSON.stringify(query));

    // Find next video
    const nextVideo = await Video.findOne(query);

    // If no specific next video, try a more general recommendation
    if (!nextVideo) {
      console.log("No specific next video found, using general recommendation");
      // Just find any video that's not current one
      const generalVideo = await Video.findOne({
        _id: { $ne: currentVideo._id },
      });
      return generalVideo ? this._formatVideo(generalVideo) : null;
    }

    return this._formatVideo(nextVideo);
  }

  /**
   * Generate a learning path with 2-3 future recommended videos
   * @param {Object} currentVideo - Current video
   * @param {Object} userProfile - User learning profile
   * @param {string} difficultyLevel - User-reported difficulty
   * @returns {Promise<Array>} - Sequence of recommended videos
   */

  async _generateLearningPath(currentVideo, userProfile, difficultyLevel) {
    const pathVideos = [];

    // 1. First priority: Videos in the same sequence (if any)
    if (
      currentVideo.sequenceId &&
      currentVideo.sequencePosition !== undefined
    ) {
      const sequenceVideos = await Video.find({
        sequenceId: currentVideo.sequenceId,
        sequencePosition: { $gt: currentVideo.sequencePosition },
      })
        .sort({ sequencePosition: 1 })
        .limit(3);

      if (sequenceVideos.length > 0) {
        return sequenceVideos.map((video) => this._formatVideo(video));
      }
    }

    // 2. Second priority: Follow prerequisites chain
    if (currentVideo.prerequisites && currentVideo.prerequisites.length > 0) {
      // Check if user has watched prerequisites
      const userWatchedVideos = (
        await UserInteraction.find({
          userId: userProfile.userId,
          videoId: { $in: currentVideo.prerequisites },
        })
      ).map((i) => i.videoId.toString());

      // Get unwatched prerequisites
      const unwatchedPrereqs = currentVideo.prerequisites.filter(
        (prereq) => !userWatchedVideos.includes(prereq.toString())
      );

      if (unwatchedPrereqs.length > 0) {
        const prereqVideos = await Video.find({
          _id: { $in: unwatchedPrereqs },
        }).limit(3);

        if (prereqVideos.length > 0) {
          return prereqVideos.map((video) => {
            const formattedVideo = this._formatVideo(video);
            formattedVideo.isPrerequisite = true;
            return formattedVideo;
          });
        }
      }
    }

    // 3. Third priority: Topic-based progression
    // Find videos with matching tags but appropriate difficulty
    if (currentVideo.tags && currentVideo.tags.length > 0) {
      const levelAdjustment =
        difficultyLevel === "difficult"
          ? -1
          : difficultyLevel === "easy"
          ? 1
          : 0;

      // Get current numeric level or default to 3 (middle)
      const currentLevel = currentVideo.level || 3;

      // Calculate target level range based on difficulty feedback
      const targetMinLevel = Math.max(1, currentLevel + levelAdjustment - 1);
      const targetMaxLevel = Math.min(5, currentLevel + levelAdjustment + 1);

      const topicVideos = await Video.find({
        _id: { $ne: currentVideo._id },
        tags: { $in: currentVideo.tags },
        level: { $gte: targetMinLevel, $lte: targetMaxLevel },
      })
        .sort({ level: difficultyLevel === "difficult" ? 1 : -1 })
        .limit(3);

      if (topicVideos.length > 0) {
        return topicVideos.map((video) => this._formatVideo(video));
      }
    }

    // 4. Fourth priority: General category progression
    // Use a more nuanced approach based on the numeric level
    const categoryVideos = await Video.find({
      _id: { $ne: currentVideo._id },
      category: currentVideo.category,
      level:
        difficultyLevel === "difficult"
          ? { $lt: currentVideo.level || 3 }
          : { $gt: currentVideo.level || 3 },
    })
      .sort({ level: difficultyLevel === "difficult" ? 1 : -1 })
      .limit(3);

    if (categoryVideos.length > 0) {
      return categoryVideos.map((video) => this._formatVideo(video));
    }

    // 5. Final fallback: Any videos not yet seen
    const allVideos = await Video.find({
      _id: { $ne: currentVideo._id },
    }).limit(3);

    return allVideos.map((video) => this._formatVideo(video));
  }

  /**
   * Remove duplicate resources from combined lists
   * @param {Array} resources - Combined resources
   * @returns {Array} - Deduplicated resources
   */
  _removeDuplicateResources(resources) {
    const uniqueMap = new Map();

    resources.forEach((resource) => {
      // Only add if not already in the map
      if (!uniqueMap.has(resource._id.toString())) {
        uniqueMap.set(resource._id.toString(), resource);
      }
    });

    return Array.from(uniqueMap.values());
  }

  /**
   * Format a resource for API response
   * @param {Object} resource - Resource from database
   * @returns {Object} - Formatted resource
   */
  _formatResource(resource) {
    return {
      _id: resource._id,
      title: resource.title || "Learning Resource",
      description: resource.description || "Additional learning material",
      type: resource.type || "text",
      url: this._formatResourceUrl(resource),
      content: resource.type === "text" ? resource.content : undefined,
      sectionStart: resource.sectionStart,
      sectionEnd: resource.sectionEnd,
      tags: resource.tags || [],
      recommendedFor: resource.recommendedFor || "",
      category: resource.category || "",
      createdAt: resource.createdAt,
    };
  }

  /**
   * Format resource URL based on type
   * @param {Object} resource - Resource object
   * @returns {string} - Formatted URL
   */
  _formatResourceUrl(resource) {
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

  /**
   * Format a video for API response
   * @param {Object} video - Video from database
   * @returns {Object} - Formatted video
   */
  _formatVideo(video) {
    if (!video) return null;

    return {
      _id: video._id,
      title: video.title,
      description: video.description || "",
      difficultyLevel: video.difficultyLevel || "intermediate",
      category: video.category || "general",
      tags: video.tags || [],
      type: "video",
      url: `/api/videos/stream/${video._id}`,
      thumbnailPath: video.thumbnailPath || "",
      duration: video.duration || 0,
    };
  }
}

// Create recommendation controller with the engine
const recommendationEngine = new RecommendationEngine();

/**
 * Get personalized recommendations based on user feedback
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId, difficultyLevel, interactionData } = req.body;

    // Validate required parameters
    if (!videoId || !userId || !difficultyLevel) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // Validate difficulty level
    if (!["easy", "justright", "difficult"].includes(difficultyLevel)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid difficulty level. Must be 'easy', 'justright', or 'difficult'",
      });
    }

    // Get personalized recommendations
    const result = await recommendationEngine.getPersonalizedRecommendations(
      videoId,
      userId,
      difficultyLevel,
      interactionData
    );

    return res.json(result);
  } catch (error) {
    console.error("Error in getPersonalizedRecommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Submit user feedback and get recommendations
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.submitFeedbackAndGetRecommendations = async (req, res) => {
  try {
    const { videoId, userId, perceivedDifficulty, comments } = req.body;

    console.log(
      `User ${userId} feedback for video ${videoId}: ${perceivedDifficulty}`
    );

    // Input validation
    if (!videoId || !userId || !perceivedDifficulty) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: videoId, userId, or perceivedDifficulty",
      });
    }

    // Validate difficulty level
    if (!["easy", "justright", "difficult"].includes(perceivedDifficulty)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid difficulty level. Must be 'easy', 'justright', or 'difficult'",
      });
    }

    // Find the video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Get any existing session interactions
    const sessionData = req.app.get("sessionInteractions") || {};
    const userInteractions = sessionData[videoId]?.[userId] || [];

    // Process interaction data if available
    let interactionData = null;
    if (userInteractions.length > 0) {
      // Use the processInteractions function from your existing code
      interactionData = processInteractions(
        userInteractions,
        video.duration || 300
      );
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

    // Get personalized recommendations
    const recommendationsResult =
      await recommendationEngine.getPersonalizedRecommendations(
        videoId,
        userId,
        perceivedDifficulty,
        interactionData
      );

    // Return success with recommendations
    return res.json({
      success: true,
      message: "Feedback submitted successfully",
      recommendations: recommendationsResult.recommendations,
    });
  } catch (error) {
    console.error("Error in submitFeedbackAndGetRecommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = exports;
