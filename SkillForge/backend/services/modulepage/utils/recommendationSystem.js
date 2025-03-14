const mockDb = require("./mockDatabase");

const getDifficultyLevel = (score) => {
  if (score <= 1) return "Low";
  if (score <= 2) return "Moderate";
  return "High";
};

const getRecommendations = (userId) => {
  console.log("Getting recommendations for user:", userId);
  const userInteractions = mockDb.getInteractionsByUserId(userId);
  const allVideos = mockDb.getVideos();
  console.log("User interactions:", userInteractions);

  // Calculate user's average difficulty level
  const userDifficulties = userInteractions.map(
    (interaction) => interaction.difficulty
  );
  const averageDifficulty =
    userDifficulties.reduce((a, b) => a + b, 0) / userDifficulties.length || 2; // Default to 2 if no interactions

  const userLevel = getDifficultyLevel(averageDifficulty);

  // Get the videos the user has already watched
  const watchedVideoIds = new Set(
    userInteractions.map((interaction) => interaction.videoId)
  );

  // Filter unwatched videos
  const unwatchedVideos = allVideos.filter(
    (video) => !watchedVideoIds.has(video.id)
  );

  // Separate recommendations by difficulty
  const currentLevelVideos = unwatchedVideos.filter(
    (video) => getDifficultyLevel(video.difficulty) === userLevel
  );
  const easierVideos = unwatchedVideos.filter(
    (video) => video.difficulty < averageDifficulty
  );
  const harderVideos = unwatchedVideos.filter(
    (video) => video.difficulty > averageDifficulty
  );

  return {
    currentLevel: currentLevelVideos.slice(0, 2),
    easierReview: easierVideos.slice(0, 1),
    challengeVideos: harderVideos.slice(0, 1),
  };
};

module.exports = { getRecommendations };

const generateRecommendations = (userId, lastVideoDifficulty) => {
  const userProfile = getUserProfile(userId);
  const allVideos = getAllVideos();

  let recommendedVideos;

  if (lastVideoDifficulty === "easy") {
    recommendedVideos = allVideos.filter(
      (v) => v.difficulty > userProfile.averageDifficulty
    );
  } else if (lastVideoDifficulty === "hard") {
    recommendedVideos = allVideos.filter(
      (v) => v.difficulty < userProfile.averageDifficulty
    );
  } else {
    recommendedVideos = allVideos.filter(
      (v) => v.difficulty === userProfile.averageDifficulty
    );
  }

  return recommendedVideos.slice(0, 3); // Return top 3 recommendations
};
