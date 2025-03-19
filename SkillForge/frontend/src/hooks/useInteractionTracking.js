import { useState, useCallback, useRef, useEffect } from "react";
import { useLearningContext } from "../context/LearningContext";
import axios from "axios";

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
  let setDifficultyLevel = () => {};
  let setRecommendations = () => {};

  try {
    const context = useLearningContext();
    if (context) {
      setDifficultyLevel = context.setDifficultyLevel || (() => {});
      setRecommendations = context.setRecommendations || (() => {});
    }
  } catch (error) {
    console.log("Learning context not available, using fallback values");
  }

  const videoRef = useRef(null);

  const [sessionData, setSessionData] = useState({
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
    if (sessionData.pauseStartTime) {
      const pauseDuration = (Date.now() - sessionData.pauseStartTime) / 1000;

      if (pauseDuration >= 2) {
        setSessionData((prevData) => ({
          ...prevData,
          pauseDurations: [...prevData.pauseDurations, pauseDuration],
          pauseStartTime: null,
        }));
      }
    }

    trackInteraction("play");

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
    trackInteraction("pause");

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

    const currentPosition = videoRef.current.currentTime;
    const prevPosition = sessionData.lastPosition;
    const positionDiff = currentPosition - prevPosition;

    let interactionType = "seek";
    let metadata = {
      prevPosition,
      currentPosition,
    };

    if (positionDiff > 0) {
      metadata.direction = "forward";
      metadata.skippedAmount = positionDiff;

      trackInteraction(interactionType, metadata);

      setSessionData((prevData) => ({
        ...prevData,
        lastInteractionTime: Date.now(),
        lastPosition: currentPosition,
        seekForwardEvents: prevData.seekForwardEvents + 1,
        skippedContent: prevData.skippedContent + positionDiff,
        interactionCount: prevData.interactionCount + 1,
      }));
    } else if (positionDiff < 0) {
      metadata.direction = "backward";
      metadata.replayAmount = Math.abs(positionDiff);

      trackInteraction(interactionType, metadata);

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

  const trackRateChange = useCallback(() => {
    if (!videoRef.current) return;

    const newSpeed = videoRef.current.playbackRate;
    const prevSpeed = sessionData.currentSpeed;

    if (newSpeed !== prevSpeed) {
      trackInteraction("speed", { prevSpeed, newSpeed });

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

  const trackProgress = useCallback(() => {
    if (!videoRef.current) return;

    const currentPosition = videoRef.current.currentTime;

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
    const finalMetrics = calculateModelMetrics();

    try {
      if (videoId && userId) {
        const response = await api.post("/videos/end-session", {
          videoId,
          userId,
          sessionData: finalMetrics,
        });

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
        if (videoId && userId) {
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
    const sessionDuration = (Date.now() - sessionData.sessionStartTime) / 1000;

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

    const pauseRate =
      sessionDuration > 0
        ? sessionData.totalPauses / (sessionDuration / 60)
        : 0;

    const replayRatio =
      sessionDuration > 0 ? sessionData.replayDuration / sessionDuration : 0;

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
    sessionData: {
      ...sessionData,
      ...modelMetrics,
    },

    setVideoElement,
    trackPlay,
    trackPause,
    trackSeek,
    trackRateChange,
    trackProgress,
    endSession,
    resetSession,

    getInteractionCount,
  };
};

export default useInteractionTracking;
