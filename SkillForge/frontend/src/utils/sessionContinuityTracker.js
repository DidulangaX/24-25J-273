// src/utils/sessionContinuityTracker.js
/**
 * Utility for tracking session continuity and persistence
 */

// Local storage key for session data
const SESSION_STORAGE_KEY = "video_learning_sessions";

class SessionContinuityTracker {
  constructor() {
    this.sessions = this.loadSessions();
  }

  /**
   * Load all session data from local storage
   */
  loadSessions() {
    try {
      const sessionsData = localStorage.getItem(SESSION_STORAGE_KEY);
      return sessionsData ? JSON.parse(sessionsData) : {};
    } catch (error) {
      console.error("Error loading sessions data:", error);
      return {};
    }
  }

  /**
   * Save all session data to local storage
   */
  saveSessions() {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (error) {
      console.error("Error saving sessions data:", error);
    }
  }

  /**
   * Start or resume a video session
   * @param {string} videoId - Video identifier
   * @param {string} userId - User identifier
   * @param {number} position - Current position in the video (seconds)
   * @returns {Object} Session info with continuation status
   */
  startSession(videoId, userId, position = 0) {
    const sessionKey = `${userId}_${videoId}`;
    const now = Date.now();
    const existingSession = this.sessions[sessionKey];

    let isContinuation = false;
    let previousPosition = 0;
    let timeSinceLastSession = 0;

    if (existingSession) {
      isContinuation = true;
      previousPosition = existingSession.lastPosition || 0;
      timeSinceLastSession = (now - existingSession.lastUpdated) / 1000; // seconds

      // Update existing session
      this.sessions[sessionKey] = {
        ...existingSession,
        sessionCount: (existingSession.sessionCount || 1) + 1,
        lastPosition: position,
        lastUpdated: now,
        resumeEvents: [
          ...(existingSession.resumeEvents || []),
          {
            timestamp: now,
            previousPosition,
            newPosition: position,
            timeSinceLastSession,
          },
        ],
      };
    } else {
      // Create new session
      this.sessions[sessionKey] = {
        videoId,
        userId,
        firstStarted: now,
        lastUpdated: now,
        lastPosition: position,
        sessionCount: 1,
        resumeEvents: [],
      };
    }

    // Save to storage
    this.saveSessions();

    return {
      isContinuation,
      previousPosition,
      timeSinceLastSession,
      sessionData: this.sessions[sessionKey],
    };
  }

  /**
   * Update the current session position
   * @param {string} videoId - Video identifier
   * @param {string} userId - User identifier
   * @param {number} position - Current position in the video (seconds)
   */
  updatePosition(videoId, userId, position) {
    const sessionKey = `${userId}_${videoId}`;
    const existingSession = this.sessions[sessionKey];

    if (existingSession) {
      this.sessions[sessionKey] = {
        ...existingSession,
        lastPosition: position,
        lastUpdated: Date.now(),
      };

      this.saveSessions();
    }
  }

  /**
   * End a video session
   * @param {string} videoId - Video identifier
   * @param {string} userId - User identifier
   * @param {number} endPosition - Final position in the video (seconds)
   * @param {number} duration - Total video duration (seconds)
   * @returns {Object} Session summary
   */
  endSession(videoId, userId, endPosition, duration) {
    const sessionKey = `${userId}_${videoId}`;
    const existingSession = this.sessions[sessionKey];

    if (!existingSession) {
      return null;
    }

    const completionRatio =
      duration > 0 ? Math.min(endPosition / duration, 1) : 0;
    const sessionSummary = {
      videoId,
      userId,
      firstStarted: existingSession.firstStarted,
      lastUpdated: Date.now(),
      sessionCount: existingSession.sessionCount,
      endPosition,
      completionRatio,
      resumeEvents: existingSession.resumeEvents || [],
    };

    // Update the session
    this.sessions[sessionKey] = {
      ...existingSession,
      lastPosition: endPosition,
      lastUpdated: Date.now(),
      completionRatio,
    };

    this.saveSessions();
    return sessionSummary;
  }

  /**
   * Get session data for a specific video
   * @param {string} videoId - Video identifier
   * @param {string} userId - User identifier
   * @returns {Object|null} Session data if exists
   */
  getSession(videoId, userId) {
    const sessionKey = `${userId}_${videoId}`;
    return this.sessions[sessionKey] || null;
  }

  /**
   * Get all sessions for a user
   * @param {string} userId - User identifier
   * @returns {Array} List of sessions
   */
  getUserSessions(userId) {
    return Object.values(this.sessions).filter(
      (session) => session.userId === userId
    );
  }
}

export default SessionContinuityTracker;
