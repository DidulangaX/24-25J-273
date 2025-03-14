import { useState, useCallback, useRef, useEffect } from "react";
import { useLearningContext } from "../context/LearningContext";
import axios from "axios";

// Create a basic API service if you don't have one
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Hook for tracking detailed video interactions
 * Collects metrics needed by the difficulty detection model
 *
 * @param {string} videoId - ID of the video being watched
 * @param {string} userId - ID of the current user
 * @returns {Object} - Tracking methods and interaction data
 */
const useInteractionTracking = (videoId, userId = "user123") => {
  // Always call the hook, even if we handle errors later
  let setDifficultyLevel = () => {};
  let setRecommendations = () => {};

  try {
    // Attempt to use the learning context
    const context = useLearningContext();
    // If context exists, extract the setters
    if (context) {
      setDifficultyLevel = context.setDifficultyLevel || (() => {});
      setRecommendations = context.setRecommendations || (() => {});
    }
  } catch (error) {
    console.log("Learning context not available, using fallback values");
  }

  // Ref to store the video element
  const videoRef = useRef(null);

  // State to track session data
  const [sessionData, setSessionData] = useState({
    // Basic session info
    videoId,
    userId,
    sessionStartTime: Date.now(),
    lastInteractionTime: Date.now(),
    lastPosition: 0,

    // Metrics tracked for the model
    sessionDuration: 0,
    totalPauses: 0,
    pauseDurations: [],
    pauseStartTime: null,
    replayEvents: 0,
    replayDuration: 0,
    seekForwardEvents: 0,
    skippedContent: 0,
    speedChanges: 0,
    currentSpeed: 1.0,
    speedHistory: [],

    // Counter for all interactions
    interactionCount: 0,
  });

  // Calculate derived metrics for the model
  const [modelMetrics, setModelMetrics] = useState({
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
  });

  // Update derived metrics whenever session data changes
  useEffect(() => {
    updateModelMetrics();
  }, [sessionData]);

  /**
   * Set the video element reference
   * @param {HTMLVideoElement} videoElement - The video DOM element
   */
  const setVideoElement = useCallback((videoElement) => {
    videoRef.current = videoElement;
  }, []);

  /**
   * Track a play event
   */
  const trackPlay = useCallback(() => {
    // If was paused, calculate pause duration
    if (sessionData.pauseStartTime) {
      const pauseDuration = (Date.now() - sessionData.pauseStartTime) / 1000;

      // Only record significant pauses (longer than 2 seconds)
      if (pauseDuration >= 2) {
        setSessionData((prevData) => ({
          ...prevData,
          pauseDurations: [...prevData.pauseDurations, pauseDuration],
          pauseStartTime: null,
        }));
      }
    }

    // Record interaction
    trackInteraction("play");

    // Update session data
    setSessionData((prevData) => ({
      ...prevData,
      lastInteractionTime: Date.now(),
      pauseStartTime: null,
      interactionCount: prevData.interactionCount + 1,
    }));
  }, [sessionData]);

  /**
   * Track a pause event
   */
  const trackPause = useCallback(() => {
    // Record interaction
    trackInteraction("pause");

    // Update session data
    setSessionData((prevData) => ({
      ...prevData,
      totalPauses: prevData.totalPauses + 1,
      lastInteractionTime: Date.now(),
      pauseStartTime: Date.now(),
      interactionCount: prevData.interactionCount + 1,
    }));
  }, []);

  /**
   * Track a seek event
   */
  const trackSeek = useCallback(() => {
    if (!videoRef.current) return;

    // Get current position
    const currentPosition = videoRef.current.currentTime;
    const prevPosition = sessionData.lastPosition;
    const positionDiff = currentPosition - prevPosition;

    let interactionType = "seek";
    let metadata = {
      prevPosition,
      currentPosition,
    };

    // Determine if seek was forward or backward
    if (positionDiff > 0) {
      // Forward seek (skipping content)
      metadata.direction = "forward";
      metadata.skippedAmount = positionDiff;

      // Record interaction
      trackInteraction(interactionType, metadata);

      // Update session data
      setSessionData((prevData) => ({
        ...prevData,
        lastInteractionTime: Date.now(),
        lastPosition: currentPosition,
        seekForwardEvents: prevData.seekForwardEvents + 1,
        skippedContent: prevData.skippedContent + positionDiff,
        interactionCount: prevData.interactionCount + 1,
      }));
    } else if (positionDiff < 0) {
      // Backward seek (replaying content)
      metadata.direction = "backward";
      metadata.replayAmount = Math.abs(positionDiff);

      // Record interaction
      trackInteraction(interactionType, metadata);

      // Update session data
      setSessionData((prevData) => ({
        ...prevData,
        lastInteractionTime: Date.now(),
        lastPosition: currentPosition,
        replayEvents: prevData.replayEvents + 1,
        replayDuration: prevData.replayDuration + Math.abs(positionDiff),
        interactionCount: prevData.interactionCount + 1,
      }));
    }
  }, [sessionData]);

  /**
   * Track a playback rate change
   */
  const trackRateChange = useCallback(() => {
    if (!videoRef.current) return;

    const newSpeed = videoRef.current.playbackRate;
    const prevSpeed = sessionData.currentSpeed;

    // Only track if speed actually changed
    if (newSpeed !== prevSpeed) {
      // Record interaction
      trackInteraction("speed", { prevSpeed, newSpeed });

      // Update session data with timing information for weighted average calculation
      const now = Date.now();
      setSessionData((prevData) => {
        const timeSinceLastSpeedChange =
          (now - prevData.lastInteractionTime) / 1000;

        return {
          ...prevData,
          lastInteractionTime: now,
          currentSpeed: newSpeed,
          speedChanges: prevData.speedChanges + 1,
          speedHistory: [
            ...prevData.speedHistory,
            { speed: prevSpeed, duration: timeSinceLastSpeedChange },
          ],
          interactionCount: prevData.interactionCount + 1,
        };
      });
    }
  }, [sessionData]);

  /**
   * Record video progress
   * Call this periodically to update session duration
   */
  const trackProgress = useCallback(() => {
    if (!videoRef.current) return;

    const currentPosition = videoRef.current.currentTime;

    // Update session data
    setSessionData((prevData) => ({
      ...prevData,
      lastPosition: currentPosition,
      sessionDuration: (Date.now() - prevData.sessionStartTime) / 1000,
    }));
  }, []);

  /**
   * End the tracking session and return final metrics
   * @returns {Object} - Complete session data and metrics
   */
  const endSession = useCallback(async () => {
    // Calculate final metrics
    const finalMetrics = calculateModelMetrics();

    try {
      // Only attempt API call if videoId and userId are valid
      if (videoId && userId) {
        // Send to backend
        const response = await api.post("/videos/end-session", {
          videoId,
          userId,
          sessionData: finalMetrics,
        });

        // Return both the raw session data and the backend response
        return {
          sessionData: {
            ...sessionData,
            ...finalMetrics,
          },
          response: response.data,
        };
      } else {
        console.log("Missing videoId or userId, skipping API call");
        return {
          sessionData: {
            ...sessionData,
            ...finalMetrics,
          },
        };
      }
    } catch (error) {
      console.error("Error ending session:", error);
      return {
        sessionData: {
          ...sessionData,
          ...finalMetrics,
        },
        error,
      };
    }
  }, [videoId, userId, sessionData]);

  /**
   * Send interaction data to the backend
   * @param {string} interactionType - Type of interaction (play, pause, seek, speed)
   * @param {Object} metadata - Additional interaction data
   */
  const trackInteraction = useCallback(
    async (interactionType, metadata = {}) => {
      try {
        // Only attempt API call if videoId and userId are valid
        if (videoId && userId) {
          // Send to backend
          await api.post("/videos/interaction", {
            videoId,
            userId,
            interactionType,
            timestamp: new Date().toISOString(),
            position: videoRef.current?.currentTime || 0,
            ...metadata,
          });
        } else {
          console.log("Missing videoId or userId, skipping API call");
        }
      } catch (error) {
        console.error("Error tracking interaction:", error);
      }
    },
    [videoId, userId]
  );

  /**
   * Calculate all metrics needed by the model
   * @returns {Object} - Formatted metrics for the model
   */
  const calculateModelMetrics = useCallback(() => {
    // Ensure sessionDuration is up-to-date
    const sessionDuration = (Date.now() - sessionData.sessionStartTime) / 1000;

    // Calculate average speed if we have speed history
    let averageSpeed = sessionData.currentSpeed;
    if (sessionData.speedHistory.length > 0) {
      const totalDuration = sessionData.speedHistory.reduce(
        (sum, entry) => sum + entry.duration,
        0
      );

      const weightedSpeed = sessionData.speedHistory.reduce(
        (sum, entry) => sum + entry.speed * entry.duration,
        0
      );

      averageSpeed =
        totalDuration > 0
          ? weightedSpeed / totalDuration
          : sessionData.currentSpeed;
    }

    // Calculate pause rate (pauses per minute)
    const pauseRate =
      sessionDuration > 0
        ? sessionData.totalPauses / (sessionDuration / 60)
        : 0;

    // Calculate replay ratio (portion of time spent replaying)
    const replayRatio =
      sessionDuration > 0 ? sessionData.replayDuration / sessionDuration : 0;

    // Calculate median pause duration
    let pauseMedianDuration = 0;
    if (sessionData.pauseDurations.length > 0) {
      const sortedDurations = [...sessionData.pauseDurations].sort(
        (a, b) => a - b
      );
      const midIndex = Math.floor(sortedDurations.length / 2);

      pauseMedianDuration =
        sortedDurations.length % 2 === 0
          ? (sortedDurations[midIndex - 1] + sortedDurations[midIndex]) / 2
          : sortedDurations[midIndex];
    }

    return {
      session_duration: sessionDuration,
      total_pauses: sessionData.totalPauses,
      pause_median_duration: pauseMedianDuration,
      replay_frequency: sessionData.replayEvents,
      replay_duration: sessionData.replayDuration,
      seek_forward_frequency: sessionData.seekForwardEvents,
      skipped_content: sessionData.skippedContent,
      speed_changes: sessionData.speedChanges,
      average_speed: averageSpeed,
      pause_rate: pauseRate,
      replay_ratio: replayRatio,
    };
  }, [sessionData]);

  /**
   * Update the model metrics state with current calculations
   */
  const updateModelMetrics = useCallback(() => {
    const metrics = calculateModelMetrics();
    setModelMetrics(metrics);
  }, [calculateModelMetrics]);

  /**
   * Get the current interaction count
   * @returns {number} - Number of interactions tracked
   */
  const getInteractionCount = useCallback(() => {
    return sessionData.interactionCount;
  }, [sessionData.interactionCount]);

  /**
   * Reset the session data (e.g., when starting a new video)
   */
  const resetSession = useCallback(() => {
    setSessionData({
      videoId,
      userId,
      sessionStartTime: Date.now(),
      lastInteractionTime: Date.now(),
      lastPosition: 0,
      sessionDuration: 0,
      totalPauses: 0,
      pauseDurations: [],
      pauseStartTime: null,
      replayEvents: 0,
      replayDuration: 0,
      seekForwardEvents: 0,
      skippedContent: 0,
      speedChanges: 0,
      currentSpeed: 1.0,
      speedHistory: [],
      interactionCount: 0,
    });
  }, [videoId, userId]);

  return {
    // Session data
    sessionData: {
      ...sessionData,
      ...modelMetrics,
    },

    // Tracking methods
    setVideoElement,
    trackPlay,
    trackPause,
    trackSeek,
    trackRateChange,
    trackProgress,
    endSession,
    resetSession,

    // Helper methods
    getInteractionCount,
  };
};

export default useInteractionTracking;
