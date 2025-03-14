import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * Hook for difficulty detection and feedback
 * Integrates with the ML model through the backend API
 */
const useDifficultyDetection = (videoId, interactionData) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [userFeedback, setUserFeedback] = useState(null);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [learningInsights, setLearningInsights] = useState(null);
  const [confidenceLevel, setConfidenceLevel] = useState(0);

  /**
   * Get difficulty prediction from the backend model
   */
  const predictDifficulty = useCallback(async () => {
    if (!interactionData || !videoId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Ensure we have all required features in the right format
      const modelData = prepareModelInput(interactionData);

      const response = await api.post(`/videos/detect-difficulty/${videoId}`, {
        userId: interactionData.userId || "user123",
        ...modelData,
      });

      if (response.data && response.data.prediction) {
        setPrediction(response.data.prediction);
        setConfidenceLevel(response.data.prediction.confidence * 100);

        // If model is very confident about difficulty, proactively show recommendations
        if (
          response.data.prediction.predicted_difficulty === 1 &&
          response.data.prediction.confidence > 0.7
        ) {
          getModelRecommendations();
        }
      } else {
        setError(response.data?.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message || "Failed to get difficulty prediction");
    } finally {
      setIsLoading(false);
    }
  }, [videoId, interactionData]);

  /**
   * Prepare model input in the correct format
   * @param {Object} data - Raw interaction data
   * @returns {Object} - Formatted data for the model
   */
  const prepareModelInput = (data) => {
    // Ensure all required features are available
    const modelInput = {
      session_duration: data.sessionDuration || data.session_duration || 0,
      total_pauses: data.totalPauses || data.total_pauses || 0,
      pause_median_duration:
        data.pauseMedianDuration || data.pause_median_duration || 0,
      replay_frequency: data.replayEvents || data.replay_frequency || 0,
      replay_duration: data.replayDuration || data.replay_duration || 0,
      seek_forward_frequency:
        data.seekForwardEvents || data.seek_forward_frequency || 0,
      skipped_content: data.skippedContent || data.skipped_content || 0,
      speed_changes: data.speedChanges || data.speed_changes || 0,
      average_speed: data.averageSpeed || data.average_speed || 1.0,
      pause_rate: calculatePauseRate(data),
      replay_ratio: calculateReplayRatio(data),
    };

    return modelInput;
  };

  /**
   * Calculate pause rate (pauses per minute)
   * @param {Object} data - Interaction data
   * @returns {number} - Calculated pause rate
   */
  const calculatePauseRate = (data) => {
    const sessionDuration = data.sessionDuration || data.session_duration || 0;
    const totalPauses = data.totalPauses || data.total_pauses || 0;

    // Calculate minutes, ensure we don't divide by zero
    const minutes = Math.max(sessionDuration / 60, 0.1);

    // Calculate pause rate with sensible limit
    return Math.min(totalPauses / minutes, 60);
  };

  /**
   * Calculate replay ratio (portion of time spent on replay)
   * @param {Object} data - Interaction data
   * @returns {number} - Calculated replay ratio
   */
  const calculateReplayRatio = (data) => {
    const sessionDuration = data.sessionDuration || data.session_duration || 0;
    const replayDuration = data.replayDuration || data.replay_duration || 0;

    // Ensure we don't divide by zero
    if (sessionDuration <= 0) return 0;

    // Calculate ratio with sensible limit (0-1)
    return Math.min(replayDuration / sessionDuration, 1);
  };

  /**
   * Submit user's difficulty feedback
   * @param {string} difficulty - User-reported difficulty (easy, justright, difficult)
   */
  const submitFeedback = useCallback(
    async (difficulty) => {
      if (!videoId || !interactionData) return;

      try {
        setIsLoading(true);
        setError(null);

        // Convert string difficulty to numeric for the model
        const difficultyValue = difficulty === "difficult" ? 1 : 0;

        // Prepare model input
        const modelData = prepareModelInput(interactionData);

        const response = await api.post(`/videos/difficulty-feedback`, {
          videoId,
          userId: interactionData.userId || "user123",
          perceivedDifficulty: difficulty,
          interactionData: modelData,
        });

        setUserFeedback(difficulty);
        setShowFeedbackPrompt(false);

        // Get recommendations based on the feedback
        if (response.data && response.data.recommendations) {
          setRecommendations(response.data.recommendations);
        } else {
          // Fallback to getting recommendations directly
          getStandardRecommendations(difficulty);
        }
      } catch (err) {
        console.error("Feedback submission error:", err);
        setError(err.message || "Failed to submit feedback");
      } finally {
        setIsLoading(false);
      }
    },
    [videoId, interactionData]
  );

  /**
   * Get standard recommendations based on difficulty level
   * @param {string} difficulty - Difficulty level (easy, justright, difficult)
   */
  const getStandardRecommendations = async (difficulty) => {
    try {
      setIsLoading(true);

      const response = await api.get(`/videos/${videoId}/recommendations`, {
        params: { difficulty },
      });

      if (response.data) {
        setRecommendations(response.data);
      }
    } catch (err) {
      console.error("Error getting recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get model-based recommendations
   */
  const getModelRecommendations = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `/videos/model-recommendations/${videoId}`,
        {
          params: {
            userId: interactionData.userId || "user123",
          },
        }
      );

      if (response.data) {
        setRecommendations(response.data);
      }
    } catch (err) {
      console.error("Error getting model recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate learning insights report
   */
  const generateInsights = useCallback(async () => {
    if (!videoId || !interactionData) return null;

    try {
      setIsLoading(true);
      setError(null);

      const modelData = prepareModelInput(interactionData);

      const response = await api.post(`/videos/insights/${videoId}`, {
        userId: interactionData.userId || "user123",
        interactionData: modelData,
        userFeedback: userFeedback
          ? userFeedback === "difficult"
            ? 1
            : 0
          : null,
      });

      if (response.data && response.data.insights) {
        setLearningInsights(response.data.insights);
        return response.data.insights;
      } else {
        setError("No insights available");
        return null;
      }
    } catch (err) {
      console.error("Insights generation error:", err);
      setError(err.message || "Failed to generate insights");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [videoId, interactionData, userFeedback]);

  /**
   * Check if feedback prompt should be shown
   * Shows prompt after significant interaction
   */
  useEffect(() => {
    if (!interactionData) return;

    // Calculate total interactions and session indicators
    const totalPauses =
      interactionData.totalPauses || interactionData.total_pauses || 0;
    const replayEvents =
      interactionData.replayEvents || interactionData.replay_frequency || 0;
    const seekForwardEvents =
      interactionData.seekForwardEvents ||
      interactionData.seek_forward_frequency ||
      0;
    const sessionDuration =
      interactionData.sessionDuration || interactionData.session_duration || 0;

    // Show feedback prompt after significant interaction (based on research insights)
    const shouldPrompt =
      totalPauses > 3 ||
      replayEvents > 2 ||
      seekForwardEvents > 4 ||
      (sessionDuration > 300 && !userFeedback);

    if (shouldPrompt && !showFeedbackPrompt && !userFeedback) {
      setShowFeedbackPrompt(true);

      // Also get a prediction at this point
      predictDifficulty();
    }
  }, [interactionData, userFeedback, showFeedbackPrompt, predictDifficulty]);

  return {
    isLoading,
    error,
    prediction,
    userFeedback,
    showFeedbackPrompt,
    recommendations,
    learningInsights,
    confidenceLevel,
    actions: {
      predictDifficulty,
      submitFeedback,
      getModelRecommendations,
      getStandardRecommendations,
      generateInsights,
      setShowFeedbackPrompt,
    },
  };
};

export default useDifficultyDetection;
