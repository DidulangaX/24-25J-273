import { post, get } from "./api";

/**
 * Send interaction data to the backend
 * @param {Object} interactionData - Video interaction data
 * @returns {Promise<Object>} - Server response
 */
export const sendInteraction = async (interactionData) => {
  try {
    const response = await post("/videos/interaction", interactionData);
    return response.data;
  } catch (error) {
    console.error("Error sending interaction data:", error);
    throw error;
  }
};

/**
 * Track a session-ending event
 * @param {string} videoId - ID of the video
 * @param {string} userId - ID of the user
 * @param {Object} sessionData - Complete session data
 * @returns {Promise<Object>} - Session summary and insights
 */
export const endSession = async (videoId, userId, sessionData) => {
  try {
    const response = await post("/videos/end-session", {
      videoId,
      userId,
      sessionData,
    });
    return response.data;
  } catch (error) {
    console.error("Error ending session:", error);
    throw error;
  }
};

/**
 * Get a difficulty prediction from the ML model
 * @param {string} videoId - ID of the video
 * @param {Object} interactionData - Processed interaction data
 * @returns {Promise<Object>} - Difficulty prediction
 */
export const predictDifficulty = async (videoId, interactionData) => {
  try {
    const response = await post(
      `/videos/detect-difficulty/${videoId}`,
      interactionData
    );
    return response.data;
  } catch (error) {
    console.error("Error predicting difficulty:", error);
    throw error;
  }
};

/**
 * Submit user feedback on content difficulty
 * @param {string} videoId - ID of the video
 * @param {string} userId - ID of the user
 * @param {string} perceivedDifficulty - User's difficulty rating (easy, justright, difficult)
 * @param {Object} interactionData - Interaction data for model update
 * @returns {Promise<Object>} - Feedback response with recommendations
 */
export const submitDifficultyFeedback = async (
  videoId,
  userId,
  perceivedDifficulty,
  interactionData
) => {
  try {
    const response = await post("/videos/difficulty-feedback", {
      videoId,
      userId,
      perceivedDifficulty,
      interactionData,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting difficulty feedback:", error);
    throw error;
  }
};

/**
 * Get recommendations based on video ID and difficulty
 * @param {string} videoId - ID of the video
 * @param {string} difficulty - Difficulty level (easy, justright, difficult)
 * @returns {Promise<Object>} - Recommendation content
 */
export const getRecommendationsByDifficulty = async (videoId, difficulty) => {
  try {
    const response = await get(`/videos/${videoId}/recommendations`, {
      difficulty,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting recommendations:", error);
    throw error;
  }
};

/**
 * Get ML model-based recommendations
 * @param {string} videoId - ID of the video
 * @param {string} userId - ID of the user
 * @returns {Promise<Object>} - Personalized recommendations with model insights
 */
export const getModelRecommendations = async (videoId, userId) => {
  try {
    const response = await get(`/videos/model-recommendations/${videoId}`, {
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting model recommendations:", error);
    throw error;
  }
};

/**
 * Generate comprehensive learning insights
 * @param {string} videoId - ID of the video
 * @param {string} userId - ID of the user
 * @param {Object} interactionData - Complete interaction data
 * @param {number|null} userFeedback - User-reported difficulty (if available)
 * @returns {Promise<Object>} - Detailed learning insights
 */
export const generateLearningInsights = async (
  videoId,
  userId,
  interactionData,
  userFeedback = null
) => {
  try {
    const response = await post(`/videos/insights/${videoId}`, {
      userId,
      interactionData,
      userFeedback,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating learning insights:", error);
    throw error;
  }
};

export default {
  sendInteraction,
  endSession,
  predictDifficulty,
  submitDifficultyFeedback,
  getRecommendationsByDifficulty,
  getModelRecommendations,
  generateLearningInsights,
};
