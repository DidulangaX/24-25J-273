let videos = [
  {
    id: "1",
    title: "Sample Video 1",
    path: "main-videos/Sample Video 1.mp4",
    duration: 300,
    difficulty: 2,
    recommendations: {
      easy: { video: "v3", pdf: "p3" },
      justright: { video: "v2", pdf: "p2" },
      difficult: { video: "v1", pdf: "p1" },
    },
  },

  {
    id: "2",
    title: "Sample Video 2",
    path: "main-videos/Sample Video 2.mp4",
    duration: 300,
    difficulty: 2,
    recommendations: {
      easy: { video: "v1", pdf: "p1" },
      justright: { video: "v2", pdf: "p2" },
      difficult: { video: "v3", pdf: "p3" },
    },
  },
  {
    id: "3",
    title: "Sample Video 3",
    path: "main-videos/Sample Video 3.mp4",
    duration: 300,
    difficulty: 2,
    recommendations: {
      easy: { video: "v1", pdf: "p1" },
      justright: { video: "v2", pdf: "p2" },
      difficult: { video: "v3", pdf: "p3" },
    },
  },
];

let recommendationVideos = [
  {
    id: "v1",
    title: "Advanced React Patterns",
    path: "recommendation-videos/advanced-react-patterns.mp4",
    difficulty: 3,
  },
  {
    id: "v2",
    title: "Intermediate React Hooks",
    path: "recommendation-videos/intermediate-react-hooks.mp4",
    difficulty: 2,
  },
  {
    id: "v3",
    title: "JavaScript Basics",
    path: "recommendation-videos/javascript-basics.mp4",
    difficulty: 1,
  },
];

let recommendationPDFs = [
  {
    id: "p1",
    title: "Advanced JavaScript Concepts",
    path: "recommendation-pdfs/advanced-js-concepts.pdf",
  },
  {
    id: "p2",
    title: "ES6+ Features Overview",
    path: "recommendation-pdfs/es6-features.pdf",
  },
  {
    id: "p3",
    title: "Introduction to Web Development",
    path: "recommendation-pdfs/intro-web-dev.pdf",
  },
];

let userInteractions = [];
let difficultyFeedback = {};
let sessionData = {};

const mockDatabase = {
  // Original functions
  getVideos: () => videos,

  getVideoById: (id) => videos.find((v) => v.id === id),

  getRecommendationVideo: (id) => recommendationVideos.find((v) => v.id === id),

  getRecommendationPDF: (id) => recommendationPDFs.find((p) => p.id === id),

  addInteraction: (interaction) => {
    userInteractions.push(interaction);
    return interaction;
  },

  getInteractions: () => userInteractions,

  getInteractionsByUserId: (userId) =>
    userInteractions.filter((interaction) => interaction.userId === userId),

  addInteractionWithDifficulty: (interaction) => {
    const video = videos.find((v) => v.id === interaction.videoId);
    const newInteraction = {
      ...interaction,
      difficulty: video ? video.difficulty : 2,
    };
    userInteractions.push(newInteraction);
    return newInteraction;
  },

  updateVideoDifficulty: (videoId, newDifficulty) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      video.difficulty = newDifficulty;
      return true;
    }
    return false;
  },

  // New functions for ML model integration

  /**
   * Save a user's difficulty feedback for a video
   * @param {string} videoId - Video ID
   * @param {string} userId - User ID
   * @param {string} difficulty - Perceived difficulty ("difficult" or "easy")
   */
  saveDifficultyFeedback: function (videoId, userId, difficulty) {
    // Initialize if needed
    if (!difficultyFeedback[videoId]) {
      difficultyFeedback[videoId] = {};
    }

    // Store the feedback
    difficultyFeedback[videoId][userId] = difficulty;

    console.log(
      `Saved difficulty feedback for video ${videoId}, user ${userId}: ${difficulty}`
    );
    return true;
  },

  /**
   * Get a user's difficulty feedback for a video
   * @param {string} videoId - Video ID
   * @param {string} userId - User ID
   * @returns {string|null} - Difficulty feedback or null if not found
   */
  getDifficultyFeedback: function (videoId, userId) {
    if (!difficultyFeedback[videoId] || !difficultyFeedback[videoId][userId]) {
      return null;
    }

    return difficultyFeedback[videoId][userId];
  },

  /**
   * Save session data for a user and video
   * @param {string} videoId - Video ID
   * @param {string} userId - User ID
   * @param {Object} data - Session data to save
   */
  saveSessionData: function (videoId, userId, data) {
    // Initialize if needed
    if (!sessionData[videoId]) {
      sessionData[videoId] = {};
    }

    // Store the session data
    sessionData[videoId][userId] = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    console.log(`Saved session data for video ${videoId}, user ${userId}`);
    return true;
  },

  /**
   * Get session data for a user and video
   * @param {string} videoId - Video ID
   * @param {string} userId - User ID
   * @returns {Object|null} - Session data or null if not found
   */
  getSessionData: function (videoId, userId) {
    if (!sessionData[videoId] || !sessionData[videoId][userId]) {
      return null;
    }

    return sessionData[videoId][userId];
  },

  /**
   * Get all session data for a video
   * @param {string} videoId - Video ID
   * @returns {Array} - Array of session data objects
   */
  getAllSessionData: function (videoId) {
    if (!sessionData[videoId]) {
      return [];
    }

    return Object.entries(sessionData[videoId]).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  },

  /**
   * Clear all session data for testing purposes
   */
  clearAllData: function () {
    userInteractions = [];
    difficultyFeedback = {};
    sessionData = {};
    return true;
  },
};

module.exports = mockDatabase;
